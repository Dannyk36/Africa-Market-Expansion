import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createInsightEvent,
  createSourceDocument,
  listRecentInsightEvents,
  listSourceDocuments,
} from "../db-helpers";
import { computeAdjustedRankings, ensureSourceConfigs, extractInsightsFromSource, refreshDueTrustedSources, refreshTrustedSources, trustedSourceCatalog } from "../insights-engine";
import { listSourceConfigs, upsertSourceConfig } from "../db-helpers";

const ingestSourceSchema = z.object({
  sourceName: z.string().min(1),
  sourceType: z.enum(["official_release", "dataset", "policy_update", "trade_update", "news_brief"]),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  regionScope: z.string().optional(),
  countryCodes: z.array(z.string()).default([]),
  publishedAt: z.string().optional(),
  trustScore: z.number().min(0).max(1).default(1),
  rawText: z.string().min(50),
  autoExtract: z.boolean().default(true),
});

export const insightsRouter = router({
  sourceCatalog: publicProcedure.query(async () => {
    await ensureSourceConfigs();
    return trustedSourceCatalog;
  }),

  runRefresh: protectedProcedure.mutation(async () => {
    try {
      return await refreshTrustedSources();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to refresh trusted sources",
      });
    }
  }),

  runDueRefresh: protectedProcedure.mutation(async () => {
    try {
      return await refreshDueTrustedSources();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to run due refresh",
      });
    }
  }),

  listSourceConfigs: publicProcedure.query(async () => {
    try {
      await ensureSourceConfigs();
      return await listSourceConfigs();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to list source configs",
      });
    }
  }),

  updateSourceConfig: protectedProcedure
    .input(
      z.object({
        sourceId: z.string(),
        sourceName: z.string(),
        enabled: z.boolean(),
        intervalHours: z.number().min(1).max(24 * 30),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const now = new Date();
        await upsertSourceConfig({
          sourceId: input.sourceId,
          sourceName: input.sourceName,
          enabled: input.enabled,
          intervalHours: input.intervalHours,
          nextRunAt: new Date(now.getTime() + input.intervalHours * 60 * 60 * 1000),
          lastStatus: "idle",
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update source config",
        });
      }
    }),

  listSources: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(25) }))
    .query(async ({ input }) => {
      try {
        return await listSourceDocuments(input.limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list source documents",
        });
      }
    }),

  listEvents: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        country: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await listRecentInsightEvents(input.limit, input.country);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list insight events",
        });
      }
    }),

  adjustedRankings: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      try {
        return await computeAdjustedRankings(input.limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to compute adjusted rankings",
        });
      }
    }),

  ingestSource: adminProcedure
    .input(ingestSourceSchema)
    .mutation(async ({ input }) => {
      try {
        const sourceDocumentId = await createSourceDocument({
          sourceName: input.sourceName,
          sourceType: input.sourceType,
          sourceUrl: input.sourceUrl,
          title: input.title,
          regionScope: input.regionScope,
          countryCodes: input.countryCodes,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
          trustScore: input.trustScore.toFixed(2) as any,
          rawText: input.rawText,
        });

        let extractedCount = 0;
        if (input.autoExtract) {
          const extracted = await extractInsightsFromSource({
            sourceName: input.sourceName,
            title: input.title,
            sourceUrl: input.sourceUrl,
            rawText: input.rawText,
            regionScope: input.regionScope,
            countryCodes: input.countryCodes,
          });

          for (const item of extracted) {
            await createInsightEvent({
              sourceDocumentId,
              country: item.country,
              eventType: item.eventType,
              title: item.title,
              summary: item.summary,
              impactDirection: item.impactDirection,
              impactScore: item.impactScore.toFixed(2) as any,
              confidence: item.confidence.toFixed(2) as any,
              effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
              expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
              tags: item.tags || [],
            });
            extractedCount += 1;
          }
        }

        return {
          success: true,
          sourceDocumentId,
          extractedCount,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to ingest source document",
        });
      }
    }),
});
