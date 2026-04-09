import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { saveQuery, getUserQueryHistory, submitFeedback, recordUsage, getUserPreferences } from "../db-helpers";
import { createLLMAdapter, LLMMessage } from "../llm-providers";
import { TRPCError } from "@trpc/server";
// Market data will be imported from client
const marketData: any[] = [];

/**
 * System prompt for market analysis
 */
const MARKET_ANALYSIS_SYSTEM_PROMPT = `You are an expert market expansion advisor specializing in African markets. 
You have access to comprehensive market data including GDP growth, ease of doing business scores, political stability, 
infrastructure quality, digital adoption, and regulatory environment for all 54 African countries.

When analyzing markets, you should:
1. Consider the user's company profile and business model
2. Evaluate market attractiveness based on multiple factors
3. Identify specific opportunities and risks
4. Provide actionable recommendations with clear reasoning
5. Reference specific data points and metrics

Always be data-driven, specific, and practical in your recommendations.`;

export const advisorRouter = router({
  /**
   * Query the AI advisor with natural language question
   */
  query: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10).max(2000),
        companyContext: z
          .object({
            industry: z.string().optional(),
            businessModel: z.string().optional(),
            targetMarkets: z.array(z.string()).optional(),
            currentPresence: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get user preferences
        const prefs = await getUserPreferences(ctx.user.id);
        if (!prefs) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User preferences not found. Please set up your preferences first.",
          });
        }

        // Build context from market data
        const marketContext = buildMarketContext(input.companyContext);

        // Prepare messages for LLM
        const messages: LLMMessage[] = [
          {
            role: "system",
            content: MARKET_ANALYSIS_SYSTEM_PROMPT + "\n\n" + marketContext,
          },
          {
            role: "user",
            content: input.question,
          },
        ];

        // Create LLM adapter
        const adapter = createLLMAdapter(prefs.preferredProvider || "openrouter", {
          apiKey: "", // Will be fetched from database
          model: prefs.preferredModel || undefined,
        });

        // Query LLM
        const response = await adapter.query(
          messages,
          parseFloat(prefs.defaultTemperature?.toString() || "0.7"),
          prefs.defaultMaxTokens || 2000
        );

        // Save query to history
        const queryId = await saveQuery(ctx.user.id, {
          provider: response.provider,
          model: response.model,
          query: input.question,
          response: response.content,
          tokensUsed: response.tokensUsed || 0,
          costUsd: response.costUsd ? response.costUsd.toString() : "0",
          queryType: "market_analysis",
        } as any);

        // Record usage
        await recordUsage(ctx.user.id, {
          provider: response.provider,
          date: new Date(),
          queriesCount: 1,
          tokensUsed: response.tokensUsed || 0,
          costUsd: response.costUsd ? response.costUsd.toString() : "0",
        } as any);

        return {
          queryId,
          response: response.content,
          tokensUsed: response.tokensUsed,
          costUsd: response.costUsd,
          model: response.model,
          provider: response.provider,
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
  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
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
 * Build market context from available data
 */
function buildMarketContext(companyContext?: { industry?: string; businessModel?: string; targetMarkets?: string[]; currentPresence?: string[] }): string {
  let context = "Available Market Data:\n\n";

  // Add company context if provided
  if (companyContext) {
    if (companyContext.industry) {
      context += `Company Industry: ${companyContext.industry}\n`;
    }
    if (companyContext.businessModel) {
      context += `Business Model: ${companyContext.businessModel}\n`;
    }
    if (companyContext.currentPresence && companyContext.currentPresence.length > 0) {
      context += `Current Presence: ${companyContext.currentPresence.join(", ")}\n`;
    }
    context += "\n";
  }

  // Add top markets summary
  context += "Top 5 Markets by Expansion Score:\n";
  const topMarkets = marketData.sort((a: any, b: any) => b.score - a.score).slice(0, 5);
  topMarkets.forEach((m: any, i: number) => {
    context += `${i + 1}. ${m.country} (Score: ${m.score}/100, Region: ${m.region})\n`;
  });

  context += "\nRegional Performance:\n";
  const regions = new Set(marketData.map((m: any) => m.region));
  regions.forEach((region: any) => {
    const regionMarkets = marketData.filter((m: any) => m.region === region);
    const avgScore = regionMarkets.reduce((sum: number, m: any) => sum + m.score, 0) / regionMarkets.length;
    context += `- ${region}: Average Score ${avgScore.toFixed(1)}/100 (${regionMarkets.length} countries)\n`;
  });

  return context;
}

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

  const weights = industryWeights[industry.toLowerCase()] || industryWeights.default;

  const riskMultiplier = {
    low: 1.2,
    medium: 1.0,
    high: 0.8,
  }[riskTolerance];

  const scored = marketData.map((market: any) => {
    let adjustedScore = market.score * riskMultiplier;

    // Apply industry-specific adjustments
    if (industry.toLowerCase() === "fintech" && market.score > 60) {
      adjustedScore *= 1.1;
    } else if (industry.toLowerCase() === "manufacturing" && market.region === "Southern Africa") {
      adjustedScore *= 1.05;
    }

    return {
      country: market.country,
      score: adjustedScore,
      reasoning: `Strong fit for ${industry} based on market score of ${market.score}/100 in ${market.region}`,
      riskLevel: market.score > 70 ? "low" : market.score > 50 ? "medium" : "high",
    };
  });

  return scored.sort((a: any, b: any) => b.score - a.score);
}
