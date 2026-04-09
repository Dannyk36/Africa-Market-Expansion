import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * API Keys table for storing user's LLM provider credentials
 * Users can add multiple API keys for different providers
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // User-friendly name (e.g., "My OpenRouter Key")
  encryptedKey: text("encrypted_key").notNull(), // Encrypted API key
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * User Preferences table for storing user settings and preferences
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  preferredProvider: mysqlEnum("preferred_provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]),
  preferredModel: varchar("preferred_model", { length: 255 }),
  defaultTemperature: decimal("default_temperature", { precision: 3, scale: 2 }).default("0.7"),
  defaultMaxTokens: int("default_max_tokens").default(2000),
  usageQuota: int("usage_quota_monthly").default(10000), // Monthly API call limit
  enableFeedback: boolean("enable_feedback").default(true),
  enableOutcomeTracking: boolean("enable_outcome_tracking").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * AI Query History table for tracking user queries and responses
 * Used for analytics, feedback collection, and outcome tracking
 */
export const queryHistory = mysqlTable("query_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  query: text("query").notNull(), // User's natural language query
  response: text("response").notNull(), // AI response
  tokensUsed: int("tokens_used"),
  costUsd: decimal("cost_usd", { precision: 8, scale: 6 }),
  queryType: mysqlEnum("query_type", ["market_analysis", "company_profile", "recommendation", "general"]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QueryHistoryRecord = typeof queryHistory.$inferSelect;
export type InsertQueryHistory = typeof queryHistory.$inferInsert;

/**
 * Feedback table for collecting user feedback on recommendations
 * Users rate recommendations and provide comments
 */
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryId: int("query_id").references(() => queryHistory.id, { onDelete: "set null" }),
  rating: int("rating").notNull(), // 1-5 star rating
  comment: text("comment"),
  recommendationAccuracy: mysqlEnum("recommendation_accuracy", ["very_poor", "poor", "neutral", "good", "excellent"]),
  actionTaken: boolean("action_taken").default(false), // Did user act on recommendation?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Investment Outcome table for tracking actual investment outcomes
 * Users report on whether recommended markets performed as expected
 */
export const investmentOutcomes = mysqlTable("investment_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryId: int("query_id").references(() => queryHistory.id, { onDelete: "set null" }),
  country: varchar("country", { length: 255 }).notNull(),
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }),
  investmentDate: timestamp("investment_date"),
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }), // Percentage
  actualReturn: decimal("actual_return", { precision: 5, scale: 2 }), // Percentage
  outcome: mysqlEnum("outcome", ["success", "partial_success", "neutral", "failure"]),
  notes: text("notes"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
});

export type InvestmentOutcome = typeof investmentOutcomes.$inferSelect;
export type InsertInvestmentOutcome = typeof investmentOutcomes.$inferInsert;

/**
 * Company Profile table for storing analyzed company information
 * Used for website analysis and company profiling
 */
export const companyProfiles = mysqlTable("company_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  businessModel: varchar("business_model", { length: 255 }),
  targetMarkets: json("target_markets").$type<string[]>(), // Array of countries
  currentPresence: json("current_presence").$type<string[]>(), // Countries where company operates
  revenue: decimal("revenue", { precision: 15, scale: 2 }),
  employees: int("employees"),
  fundingStage: varchar("funding_stage", { length: 255 }),
  keyCapabilities: json("key_capabilities").$type<string[]>(), // Array of strengths
  analysisDate: timestamp("analysis_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;

/**
 * Market Recommendations table for storing AI-generated recommendations
 * Links company profiles to recommended markets with reasoning
 */
export const marketRecommendations = mysqlTable("market_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyProfileId: int("company_profile_id").references(() => companyProfiles.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 255 }).notNull(),
  recommendationScore: decimal("recommendation_score", { precision: 5, scale: 2 }).notNull(), // 0-100
  reasoning: text("reasoning").notNull(), // Why this market is recommended
  riskLevel: mysqlEnum("risk_level", ["very_low", "low", "medium", "high", "very_high"]).notNull(),
  entryStrategy: text("entry_strategy"), // Recommended market entry approach
  potentialRevenue: decimal("potential_revenue", { precision: 15, scale: 2 }),
  timelineMonths: int("timeline_months"), // Estimated time to market entry
  userFeedback: mysqlEnum("user_feedback", ["positive", "neutral", "negative"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MarketRecommendation = typeof marketRecommendations.$inferSelect;
export type InsertMarketRecommendation = typeof marketRecommendations.$inferInsert;

/**
 * Usage Analytics table for tracking API usage and costs
 * Used for billing, quota management, and analytics
 */
export const usageAnalytics = mysqlTable("usage_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow().notNull(),
  provider: mysqlEnum("provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]).notNull(),
  queriesCount: int("queries_count").default(0),
  tokensUsed: int("tokens_used").default(0),
  costUsd: decimal("cost_usd", { precision: 8, scale: 6 }).default("0"),
});

export type UsageAnalytic = typeof usageAnalytics.$inferSelect;
export type InsertUsageAnalytic = typeof usageAnalytics.$inferInsert;

/**
 * Scoring Adjustments table for tracking scoring model improvements
 * Records when scoring is adjusted based on actual outcomes
 */
export const scoringAdjustments = mysqlTable("scoring_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  country: varchar("country", { length: 255 }).notNull(),
  originalScore: decimal("original_score", { precision: 5, scale: 2 }).notNull(),
  adjustedScore: decimal("adjusted_score", { precision: 5, scale: 2 }).notNull(),
  adjustmentReason: varchar("adjustment_reason", { length: 255 }).notNull(),
  dataPoints: int("data_points").notNull(), // Number of outcomes used for adjustment
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100 confidence level
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ScoringAdjustment = typeof scoringAdjustments.$inferSelect;
export type InsertScoringAdjustment = typeof scoringAdjustments.$inferInsert;
