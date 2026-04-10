import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCompanyProfile,
  createMarketRecommendation,
  getCompanyProfile,
  getMarketRecommendations,
  getUserCompanyProfiles,
} from "../db-helpers";

export const companyAnalysisRouter = router({
  analyzeWebsite: protectedProcedure
    .input(
      z.object({
        websiteUrl: z.string().url(),
        companyName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert business analyst. Extract a concise company profile from the supplied website URL and respond as JSON.",
            },
            {
              role: "user",
              content: `Analyze this company website: ${input.websiteUrl}

Return JSON with:
{
  "industry": "string",
  "businessModel": "string",
  "targetMarkets": ["string"],
  "keyCapabilities": ["string"],
  "estimatedRevenue": "string",
  "fundingStage": "string"
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "company_profile",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  industry: { type: "string" },
                  businessModel: { type: "string" },
                  targetMarkets: { type: "array", items: { type: "string" } },
                  keyCapabilities: { type: "array", items: { type: "string" } },
                  estimatedRevenue: { type: "string" },
                  fundingStage: { type: "string" },
                },
                required: [
                  "industry",
                  "businessModel",
                  "targetMarkets",
                  "keyCapabilities",
                  "estimatedRevenue",
                  "fundingStage",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        let profileData: Record<string, unknown> = {};
        const content = response.choices[0]?.message.content;
        if (typeof content === "string") {
          profileData = JSON.parse(content);
        }

        const profileId = await createCompanyProfile(ctx.user.id, {
          companyName: input.companyName || "Analyzed Company",
          website: input.websiteUrl,
          industry: (profileData.industry as string) || "Unknown",
          businessModel: (profileData.businessModel as string) || "Unknown",
          targetMarkets: (profileData.targetMarkets as string[]) || [],
          keyCapabilities: (profileData.keyCapabilities as string[]) || [],
          fundingStage: profileData.fundingStage as string | undefined,
        } as any);

        return {
          success: true,
          profileId,
          profile: profileData,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to analyze website",
        });
      }
    }),

  analyzeDocument: protectedProcedure
    .input(
      z.object({
        documentContent: z.string().min(1),
        documentName: z.string().min(1),
        companyName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert business analyst. Extract a concise company profile from the supplied document and respond as JSON.",
            },
            {
              role: "user",
              content: `Analyze this company document named ${input.documentName}:

${input.documentContent}

Return JSON with:
{
  "industry": "string",
  "businessModel": "string",
  "targetMarkets": ["string"],
  "keyCapabilities": ["string"],
  "estimatedRevenue": "string",
  "fundingStage": "string"
}`,
            },
          ],
        });

        let profileData: Record<string, unknown> = {};
        const content = response.choices[0]?.message.content;
        if (typeof content === "string") {
          profileData = JSON.parse(content);
        }

        const profileId = await createCompanyProfile(ctx.user.id, {
          companyName: input.companyName || "Analyzed Company",
          industry: (profileData.industry as string) || "Unknown",
          businessModel: (profileData.businessModel as string) || "Unknown",
          targetMarkets: (profileData.targetMarkets as string[]) || [],
          keyCapabilities: (profileData.keyCapabilities as string[]) || [],
          fundingStage: profileData.fundingStage as string | undefined,
        } as any);

        return {
          success: true,
          profileId,
          profile: profileData,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to analyze document",
        });
      }
    }),

  getRecommendations: protectedProcedure
    .input(
      z.object({
        profileId: z.number(),
        topN: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const profile = await getCompanyProfile(ctx.user.id, input.profileId);
        if (!profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Company profile not found",
          });
        }

        let recommendations = await getMarketRecommendations(
          ctx.user.id,
          input.profileId
        );

        if (recommendations.length === 0) {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are an expert in African market expansion. Recommend the best markets for the company profile and respond as a JSON array.",
              },
              {
                role: "user",
                content: `Company profile:
Industry: ${profile.industry}
Business model: ${profile.businessModel}
Target markets: ${profile.targetMarkets}
Capabilities: ${profile.keyCapabilities}

Recommend the top ${input.topN} African markets with fields:
country, score, reasoning, riskLevel`,
              },
            ],
          });

          const content = response.choices[0]?.message.content;
          if (typeof content === "string") {
            const parsed = JSON.parse(content) as Array<{
              country: string;
              score: number;
              reasoning: string;
              riskLevel: "very_low" | "low" | "medium" | "high" | "very_high";
            }>;

            for (const recommendation of parsed) {
              await createMarketRecommendation(ctx.user.id, {
                companyProfileId: input.profileId,
                country: recommendation.country,
                recommendationScore: recommendation.score as any,
                reasoning: recommendation.reasoning,
                riskLevel: recommendation.riskLevel,
              } as any);
            }

            recommendations = await getMarketRecommendations(
              ctx.user.id,
              input.profileId
            );
          }
        }

        return {
          success: true,
          profileId: input.profileId,
          recommendations: recommendations.slice(0, input.topN),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recommendations",
        });
      }
    }),

  listProfiles: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getUserCompanyProfiles(ctx.user.id);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch company profiles",
      });
    }
  }),
});
