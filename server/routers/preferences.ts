import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserPreferences, createUserPreferences, updateUserPreferences } from "../db-helpers";
import { TRPCError } from "@trpc/server";

export const preferencesRouter = router({
  /**
   * Get user preferences
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      let prefs = await getUserPreferences(ctx.user.id);

      // Create default preferences if they don't exist
      if (!prefs) {
        await createUserPreferences(ctx.user.id, {
          preferredProvider: "openrouter",
          preferredModel: "meta-llama/llama-2-70b-chat",
          defaultTemperature: "0.7" as any,
          defaultMaxTokens: 2000,
          usageQuota: 10000,
          enableFeedback: true,
          enableOutcomeTracking: true,
        });

        prefs = await getUserPreferences(ctx.user.id);
      }

      return prefs;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch preferences",
      });
    }
  }),

  /**
   * Update user preferences
   */
  update: protectedProcedure
    .input(
      z.object({
        preferredProvider: z.enum(["openrouter", "openai", "anthropic", "cohere", "custom"]).optional(),
        preferredModel: z.string().optional(),
        defaultTemperature: z.number().min(0).max(2).optional(),
        defaultMaxTokens: z.number().min(100).max(4000).optional(),
        usageQuota: z.number().min(100).optional(),
        enableFeedback: z.boolean().optional(),
        enableOutcomeTracking: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updateData: any = { ...input };
        if (input.defaultTemperature !== undefined) {
          updateData.defaultTemperature = input.defaultTemperature.toString();
        }
        await updateUserPreferences(ctx.user.id, updateData);

        return {
          success: true,
          message: "Preferences updated successfully",
          data: updateData,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update preferences",
        });
      }
    }),
});
