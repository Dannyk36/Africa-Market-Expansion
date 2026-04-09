import axios from "axios";

export type LLMProvider = "openrouter" | "openai" | "anthropic" | "cohere" | "custom";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  costUsd?: number;
  model: string;
  provider: LLMProvider;
}

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenRouter adapter - unified API for multiple models
 */
export class OpenRouterAdapter {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "meta-llama/llama-2-70b-chat";
  }

  async query(messages: LLMMessage[], temperature = 0.7, maxTokens = 2000): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://africa-market-expansion.manus.space",
            "X-Title": "Africa Market Expansion",
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || "";
      const tokensUsed = response.data.usage?.total_tokens || 0;

      // Estimate cost (varies by model)
      const costUsd = (tokensUsed / 1000) * 0.002; // Rough estimate

      return {
        content,
        tokensUsed,
        costUsd,
        model: this.model,
        provider: "openrouter",
      };
    } catch (error) {
      throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * OpenAI adapter
 */
export class OpenAIAdapter {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-3.5-turbo";
  }

  async query(messages: LLMMessage[], temperature = 0.7, maxTokens = 2000): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || "";
      const tokensUsed = response.data.usage?.total_tokens || 0;

      // Cost calculation for OpenAI
      let costUsd = 0;
      if (this.model.includes("gpt-4")) {
        costUsd = (tokensUsed / 1000) * 0.03; // Rough estimate for GPT-4
      } else {
        costUsd = (tokensUsed / 1000) * 0.002; // Estimate for GPT-3.5
      }

      return {
        content,
        tokensUsed,
        costUsd,
        model: this.model,
        provider: "openai",
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Anthropic (Claude) adapter
 */
export class AnthropicAdapter {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1";
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "claude-3-sonnet-20240229";
  }

  async query(messages: LLMMessage[], temperature = 0.7, maxTokens = 2000): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          max_tokens: maxTokens,
          temperature,
          messages,
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
        }
      );

      const content = response.data.content[0]?.text || "";
      const tokensUsed = (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0);

      // Cost calculation for Anthropic
      const costUsd = (tokensUsed / 1000) * 0.003; // Rough estimate

      return {
        content,
        tokensUsed,
        costUsd,
        model: this.model,
        provider: "anthropic",
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Cohere adapter
 */
export class CohereAdapter {
  private apiKey: string;
  private baseUrl = "https://api.cohere.ai/v1";
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "command";
  }

  async query(messages: LLMMessage[], temperature = 0.7, maxTokens = 2000): Promise<LLMResponse> {
    try {
      // Convert messages to Cohere format
      const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

      const response = await axios.post(
        `${this.baseUrl}/generate`,
        {
          model: this.model,
          prompt: text,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.generations[0]?.text || "";
      const tokensUsed = response.data.meta?.tokens?.input_tokens || 0;

      const costUsd = (tokensUsed / 1000) * 0.001; // Rough estimate

      return {
        content,
        tokensUsed,
        costUsd,
        model: this.model,
        provider: "cohere",
      };
    } catch (error) {
      throw new Error(`Cohere API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Custom provider adapter for user-provided endpoints
 */
export class CustomAdapter {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "";
    this.model = config.model || "custom-model";

    if (!this.baseUrl) {
      throw new Error("baseUrl is required for custom provider");
    }
  }

  async query(messages: LLMMessage[], temperature = 0.7, maxTokens = 2000): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || "";
      const tokensUsed = response.data.usage?.total_tokens || 0;
      const costUsd = 0; // Custom providers may have different pricing

      return {
        content,
        tokensUsed,
        costUsd,
        model: this.model,
        provider: "custom",
      };
    } catch (error) {
      throw new Error(`Custom provider API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function to create appropriate adapter based on provider
 */
export function createLLMAdapter(provider: LLMProvider, config: LLMProviderConfig) {
  switch (provider) {
    case "openrouter":
      return new OpenRouterAdapter(config);
    case "openai":
      return new OpenAIAdapter(config);
    case "anthropic":
      return new AnthropicAdapter(config);
    case "cohere":
      return new CohereAdapter(config);
    case "custom":
      return new CustomAdapter(config);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Get available models for each provider
 */
export const AVAILABLE_MODELS: Record<LLMProvider, string[]> = {
  openrouter: [
    "meta-llama/llama-2-70b-chat",
    "openai/gpt-4",
    "openai/gpt-3.5-turbo",
    "anthropic/claude-3-opus",
    "anthropic/claude-3-sonnet",
  ],
  openai: ["gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo"],
  anthropic: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
  cohere: ["command", "command-light", "command-nightly"],
  custom: ["custom-model"],
};
