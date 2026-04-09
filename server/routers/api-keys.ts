import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { addApiKey, deleteApiKey, getUserApiKeys, getApiKey } from "../db-helpers";
import { TRPCError } from "@trpc/server";

export const apiKeysRouter = router({
  /**
   * List all API keys for the current user
   * Returns keys without the actual encrypted values for security
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const keys = await getUserApiKeys(ctx.user.id);
      return keys.map((k) => ({
        id: k.id,
        provider: k.provider,
        name: k.name,
        isActive: k.isActive,
        lastUsed: k.lastUsed,
        createdAt: k.createdAt,
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch API keys",
      });
    }
  }),

  /**
   * Add a new API key
   */
  add: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["openrouter", "openai", "anthropic", "cohere", "custom"]),
        name: z.string().min(1).max(255),
        apiKey: z.string().min(1),
        baseUrl: z.string().optional(), // For custom providers
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await addApiKey(ctx.user.id, {
          provider: input.provider,
          name: input.name,
          encryptedKey: input.apiKey,
          isActive: true,
        });

        return {
          success: true,
          message: `API key for ${input.provider} added successfully`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add API key",
        });
      }
    }),

  /**
   * Delete an API key
   */
  delete: protectedProcedure
    .input(
      z.object({
        keyId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const key = await getApiKey(ctx.user.id, input.keyId);
        if (!key) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "API key not found",
          });
        }

        await deleteApiKey(ctx.user.id, input.keyId);

        return {
          success: true,
          message: "API key deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete API key",
        });
      }
    }),

  /**
   * Test an API key by making a simple request
   */
  test: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["openrouter", "openai", "anthropic", "cohere", "custom"]),
        apiKey: z.string(),
        baseUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { createLLMAdapter } = await import("../llm-providers");

        const adapter = createLLMAdapter(input.provider, {
          apiKey: input.apiKey,
          baseUrl: input.baseUrl,
          model: undefined,
        });

        const response = await adapter.query([
          {
            role: "user",
            content: "Say 'API key is valid' if you can read this.",
          },
        ]);

        return {
          success: true,
          message: "API key is valid",
          response: response.content,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "API key test failed",
        };
      }
    }),
});
