import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getPreferredApiKey, saveQuery, getUserQueryHistory, submitFeedback, recordUsage, getUserPreferences, listRecentInsightEvents } from "../db-helpers";
import { createLLMAdapter, LLMMessage } from "../llm-providers";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { countryScores } from "../../client/src/lib/marketData";

function isPrivateIp(hostname: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    const parts = hostname.split(".").map(Number);
    if (parts.length !== 4 || parts.some(part => Number.isNaN(part) || part < 0 || part > 255)) {
      return true;
    }
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }

  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "::1"
  );
}

function assertSafePublicUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Website URL is not valid.",
    });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only http and https websites are supported.",
    });
  }

  if (isPrivateIp(parsed.hostname)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Private, local, or internal website addresses are not allowed.",
    });
  }

  return parsed.toString();
}

/**
 * System prompt for market analysis
 */
const MARKET_ANALYSIS_SYSTEM_PROMPT = `You are an expert investment, market analytics, and expansion strategy advisor specializing in African markets.
You provide rigorous, decision-useful analysis across investing, company strategy, market entry, risk, pricing, competitive positioning, capital allocation, portfolio thinking, and operational execution.
You have access to market data including GDP growth, ease of doing business scores, governance signals, digital adoption, and regional comparisons for 54 African countries.

When analyzing markets, you should:
1. Consider the user's company profile and business model
2. Evaluate market attractiveness based on multiple factors
3. Identify opportunities, risks, constraints, and upside drivers
4. Provide actionable recommendations with clear reasoning
5. Reference specific data points and metrics from the supplied context
6. Distinguish between facts from context, reasonable inference, and assumptions

Always be data-driven, specific, and practical. When context is incomplete, say so and recommend what to validate next.`;

const attachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.enum(["website", "document", "image"]),
  content: z.string().optional(),
});

async function scrapeWebsiteContent(url: string) {
  try {
    const safeUrl = assertSafePublicUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(safeUrl, {
      headers: {
        "user-agent": "AfricaMarketExpansionBot/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return `Failed to fetch website ${safeUrl}: ${response.status} ${response.statusText}`;
    }

    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 6000);
  } catch (error) {
    return `Failed to fetch website ${url}: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

async function buildAttachmentContext(
  attachments: Array<z.infer<typeof attachmentSchema>>
) {
  if (attachments.length === 0) return "";

  const parts = await Promise.all(
    attachments.map(async attachment => {
      if (attachment.type === "website") {
        const websiteText = await scrapeWebsiteContent(attachment.content || attachment.name);
        return `Website: ${attachment.name}\n${websiteText}`;
      }

      if (attachment.content?.trim()) {
        return `${attachment.type === "document" ? "Document" : "Image"}: ${attachment.name}\n${attachment.content.slice(0, 6000)}`;
      }

      return `${attachment.type === "document" ? "Document" : "Image"}: ${attachment.name}\nNo extracted text was provided.`;
    })
  );

  return parts.join("\n\n");
}

async function buildInsightContext(companyContext?: {
  targetMarkets?: string[];
}) {
  const targets = companyContext?.targetMarkets || [];
  const eventGroups = await Promise.all(
    (targets.length > 0 ? targets : [undefined]).map(target =>
      listRecentInsightEvents(target ? 5 : 10, target)
    )
  );

  const events = eventGroups.flat();
  if (events.length === 0) return { text: "", events: [] as typeof events };

  const uniqueLines = events.map(event =>
    `${event.country}: [${event.eventType}] ${event.title} | ${event.impactDirection} impact (${event.impactScore}) | ${event.summary}`
  );

  return {
    text: `Recent trusted-source qualitative insights:\n${uniqueLines.join("\n")}`,
    events,
  };
}

function buildMarketContext(companyContext?: {
  companyName?: string;
  industry?: string;
  businessModel?: string;
  targetMarkets?: string[];
  currentPresence?: string[];
  strategicNotes?: string;
}) {
  let context = "Available Market Data:\n\n";

  if (companyContext) {
    if (companyContext.companyName) {
      context += `Company Name: ${companyContext.companyName}\n`;
    }
    if (companyContext.industry) {
      context += `Company Industry: ${companyContext.industry}\n`;
    }
    if (companyContext.businessModel) {
      context += `Business Model: ${companyContext.businessModel}\n`;
    }
    if (companyContext.targetMarkets?.length) {
      context += `Target Markets: ${companyContext.targetMarkets.join(", ")}\n`;
    }
    if (companyContext.currentPresence?.length) {
      context += `Current Presence: ${companyContext.currentPresence.join(", ")}\n`;
    }
    if (companyContext.strategicNotes) {
      context += `Strategic Notes: ${companyContext.strategicNotes}\n`;
    }
    context += "\n";
  }

  const topMarkets = [...countryScores].sort((a, b) => b.score - a.score).slice(0, 10);
  context += "Top 10 Markets by Expansion Score:\n";
  topMarkets.forEach((market, index) => {
    context += `${index + 1}. ${market.name} (${market.region}) score ${market.score}, GDP growth ${market.gdpGrowth}%, business readiness ${market.businessReady}, ICT ${market.idi}, corruption index ${market.corruption}\n`;
  });

  context += "\nRegional Performance:\n";
  const regions = Array.from(new Set(countryScores.map(country => country.region)));
  regions.forEach(region => {
    const regionMarkets = countryScores.filter(country => country.region === region);
    const avgScore =
      regionMarkets.reduce((sum, market) => sum + market.score, 0) /
      regionMarkets.length;
    context += `- ${region}: average score ${avgScore.toFixed(1)} across ${regionMarkets.length} countries\n`;
  });

  return {
    text: context,
    topMarkets: topMarkets.map(market => ({
      name: market.name,
      region: market.region,
      score: market.score,
    })),
  };
}

async function runAdvisorLLM(params: {
  userId?: number;
  messages: LLMMessage[];
  preferredProvider?: "openrouter" | "openai" | "anthropic" | "cohere" | "custom" | null;
  preferredModel?: string | null;
  temperature?: number;
  maxTokens?: number;
}) {
  const {
    userId,
    messages,
    preferredProvider,
    preferredModel,
    temperature = 0.7,
    maxTokens = 2000,
  } = params;

  if (userId) {
    const storedKey = await getPreferredApiKey(userId, preferredProvider || undefined);
    if (storedKey) {
      const adapter = createLLMAdapter(storedKey.provider, {
        apiKey: storedKey.encryptedKey,
        baseUrl: storedKey.baseUrl || undefined,
        model: preferredModel || undefined,
      });

      return await adapter.query(messages, temperature, maxTokens);
    }
  }

  const fallback = await invokeLLM({
    messages: messages.map(message => ({
      role: message.role,
      content: message.content,
    })),
    max_tokens: maxTokens,
  });

  return {
    content:
      typeof fallback.choices[0]?.message.content === "string"
        ? fallback.choices[0].message.content
        : JSON.stringify(fallback.choices[0]?.message.content ?? ""),
    tokensUsed: fallback.usage?.total_tokens,
    costUsd: 0,
    model: fallback.model,
    provider: (preferredProvider || "custom") as "openrouter" | "openai" | "anthropic" | "cohere" | "custom",
  };
}

export const advisorRouter = router({
  /**
   * Query the AI advisor with natural language question
   */
  query: publicProcedure
    .input(
      z.object({
        question: z.string().min(2).max(4000).optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
        attachments: z.array(attachmentSchema).default([]),
        companyContext: z
          .object({
            companyName: z.string().optional(),
            industry: z.string().optional(),
            businessModel: z.string().optional(),
            targetMarkets: z.array(z.string()).optional(),
            currentPresence: z.array(z.string()).optional(),
            strategicNotes: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const prefs = ctx.user ? await getUserPreferences(ctx.user.id) : null;

        const marketContext = buildMarketContext(input.companyContext);
        const attachmentContext = await buildAttachmentContext(input.attachments);
        const insightContext = await buildInsightContext(input.companyContext);
        const transcript = input.messages?.filter(message => message.role !== "system") ?? [];
        const recentTranscript = transcript.slice(-10);
        const question = input.question || recentTranscript[recentTranscript.length - 1]?.content;

        if (!question) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A question or message history is required.",
          });
        }

        const messages: LLMMessage[] = [
          {
            role: "system",
            content: [
              MARKET_ANALYSIS_SYSTEM_PROMPT,
              marketContext.text,
              insightContext.text,
              attachmentContext ? `Attached context:\n${attachmentContext}` : "",
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
          ...recentTranscript.map(message => ({
            role: message.role,
            content: message.content,
          })),
        ];

        if (messages[messages.length - 1]?.role !== "user") {
          messages.push({ role: "user", content: question });
        }

        const response = await runAdvisorLLM({
          userId: ctx.user?.id,
          messages,
          preferredProvider: prefs?.preferredProvider || "custom",
          preferredModel: prefs?.preferredModel || undefined,
          temperature: parseFloat(prefs?.defaultTemperature?.toString() || "0.7"),
          maxTokens: prefs?.defaultMaxTokens || 2000,
        });

        let queryId: number | null = null;
        if (ctx.user) {
          try {
            queryId = await saveQuery(ctx.user.id, {
              provider: response.provider,
              model: response.model,
              query: question,
              response: response.content,
              tokensUsed: response.tokensUsed || 0,
              costUsd: response.costUsd ? response.costUsd.toString() : "0",
              queryType: "market_analysis",
            } as any);

            await recordUsage(ctx.user.id, {
              provider: response.provider,
              date: new Date(),
              queriesCount: 1,
              tokensUsed: response.tokensUsed || 0,
              costUsd: response.costUsd ? response.costUsd.toString() : "0",
            } as any);
          } catch {
            queryId = null;
          }
        }

        return {
          queryId,
          response: response.content,
          tokensUsed: response.tokensUsed,
          costUsd: response.costUsd,
          model: response.model,
          provider: response.provider,
          evidence: {
            topMarkets: marketContext.topMarkets.slice(0, 5),
            recentEvents: insightContext.events.slice(0, 5).map(event => ({
              country: event.country,
              eventType: event.eventType,
              title: event.title,
              impactDirection: event.impactDirection,
            })),
            attachmentsUsed: input.attachments.map(attachment => ({
              name: attachment.name,
              type: attachment.type,
            })),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to process query",
        });
      }
    }),

  /**
   * Get query history
   */
  history: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) return [];
        return await getUserQueryHistory(ctx.user.id, input.limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch query history",
        });
      }
    }),

  /**
   * Submit feedback on a recommendation
   */
  feedback: protectedProcedure
    .input(
      z.object({
        queryId: z.number(),
        rating: z.number().min(1).max(5),
        accuracy: z.enum(["very_poor", "poor", "neutral", "good", "excellent"]).optional(),
        comment: z.string().optional(),
        actionTaken: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await submitFeedback(ctx.user.id, {
          queryId: input.queryId,
          rating: input.rating,
          recommendationAccuracy: input.accuracy,
          comment: input.comment,
          actionTaken: input.actionTaken,
        } as any);

        return {
          success: true,
          message: "Feedback submitted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit feedback",
        });
      }
    }),

  /**
   * Get suggested markets based on company profile
   */
  suggestMarkets: protectedProcedure
    .input(
      z.object({
        industry: z.string(),
        businessModel: z.string(),
        riskTolerance: z.enum(["low", "medium", "high"]).default("medium"),
        topN: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Score markets based on company profile
        const scoredMarkets = scoreMarketsForCompany(input.industry, input.businessModel, input.riskTolerance);

        // Return top N markets
        return scoredMarkets.slice(0, input.topN).map((m) => ({
          country: m.country,
          score: m.score,
          reasoning: m.reasoning,
          riskLevel: m.riskLevel,
        }));
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to suggest markets",
        });
      }
    }),
});

/**
 * Score markets based on company profile
 */
function scoreMarketsForCompany(
  industry: string,
  businessModel: string,
  riskTolerance: "low" | "medium" | "high"
): Array<{ country: string; score: number; reasoning: string; riskLevel: string }> {
  const industryWeights: Record<string, Record<string, number>> = {
    fintech: {
      "digital_adoption": 0.4,
      "ease_of_doing_business": 0.3,
      "gdp_growth": 0.2,
      "political_stability": 0.1,
    },
    manufacturing: {
      "infrastructure": 0.3,
      "ease_of_doing_business": 0.3,
      "gdp_growth": 0.2,
      "political_stability": 0.2,
    },
    ecommerce: {
      "digital_adoption": 0.35,
      "gdp_growth": 0.3,
      "ease_of_doing_business": 0.2,
      "political_stability": 0.15,
    },
    default: {
      "ease_of_doing_business": 0.3,
      "gdp_growth": 0.3,
      "political_stability": 0.2,
      "digital_adoption": 0.2,
    },
  };

  const riskMultiplier = {
    low: 1.2,
    medium: 1.0,
    high: 0.8,
  }[riskTolerance];

  const scored = countryScores.map((market: any) => {
    let adjustedScore = market.score * riskMultiplier;

    // Apply industry-specific adjustments
    if (industry.toLowerCase() === "fintech" && market.score > 60) {
      adjustedScore *= 1.1;
    } else if (industry.toLowerCase() === "manufacturing" && market.region === "Southern Africa") {
      adjustedScore *= 1.05;
    }

    return {
      country: market.name,
      score: adjustedScore,
      reasoning: `Strong fit for ${industry} based on market score of ${market.score}/100 in ${market.region}`,
      riskLevel: market.score > 70 ? "low" : market.score > 50 ? "medium" : "high",
    };
  });

  return scored.sort((a: any, b: any) => b.score - a.score);
}
