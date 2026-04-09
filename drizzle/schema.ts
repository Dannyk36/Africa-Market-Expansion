import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * API Keys table for storing user's LLM provider credentials
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  encryptedKey: text("encrypted_key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * User Preferences table
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  preferredProvider: mysqlEnum("preferred_provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]),
  preferredModel: varchar("preferred_model", { length: 255 }),
  defaultTemperature: decimal("default_temperature", { precision: 3, scale: 2 }).default("0.7"),
  defaultMaxTokens: int("default_max_tokens").default(2000),
  usageQuota: int("usage_quota_monthly").default(10000),
  enableFeedback: boolean("enable_feedback").default(true),
  enableOutcomeTracking: boolean("enable_outcome_tracking").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * AI Query History table
 */
export const queryHistory = mysqlTable("query_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["openrouter", "openai", "anthropic", "cohere", "custom"]).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),
  tokensUsed: int("tokens_used"),
  costUsd: decimal("cost_usd", { precision: 8, scale: 6 }),
  queryType: mysqlEnum("query_type", ["market_analysis", "company_profile", "recommendation", "general"]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QueryHistoryRecord = typeof queryHistory.$inferSelect;
export type InsertQueryHistory = typeof queryHistory.$inferInsert;

/**
 * Feedback table
 */
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryId: int("query_id").references(() => queryHistory.id, { onDelete: "set null" }),
  rating: int("rating").notNull(),
  comment: text("comment"),
  recommendationAccuracy: mysqlEnum("recommendation_accuracy", ["very_poor", "poor", "neutral", "good", "excellent"]),
  actionTaken: boolean("action_taken").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Investment Outcome table
 */
export const investmentOutcomes = mysqlTable("investment_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryId: int("query_id").references(() => queryHistory.id, { onDelete: "set null" }),
  country: varchar("country", { length: 255 }).notNull(),
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }),
  investmentDate: timestamp("investment_date"),
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }),
  actualReturn: decimal("actual_return", { precision: 5, scale: 2 }),
  outcome: mysqlEnum("outcome", ["success", "partial_success", "neutral", "failure"]),
  notes: text("notes"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
});

export type InvestmentOutcome = typeof investmentOutcomes.$inferSelect;
export type InsertInvestmentOutcome = typeof investmentOutcomes.$inferInsert;

/**
 * Company Profile table
 */
export const companyProfiles = mysqlTable("company_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  businessModel: varchar("business_model", { length: 255 }),
  targetMarkets: json("target_markets").$type<string[]>(),
  currentPresence: json("current_presence").$type<string[]>(),
  revenue: decimal("revenue", { precision: 15, scale: 2 }),
  employees: int("employees"),
  fundingStage: varchar("funding_stage", { length: 255 }),
  keyCapabilities: json("key_capabilities").$type<string[]>(),
  analysisDate: timestamp("analysis_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;

/**
 * Market Recommendations table
 */
export const marketRecommendations = mysqlTable("market_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyProfileId: int("company_profile_id").references(() => companyProfiles.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 255 }).notNull(),
  recommendationScore: decimal("recommendation_score", { precision: 5, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull(),
  riskLevel: mysqlEnum("risk_level", ["very_low", "low", "medium", "high", "very_high"]).notNull(),
  entryStrategy: text("entry_strategy"),
  potentialRevenue: decimal("potential_revenue", { precision: 15, scale: 2 }),
  timelineMonths: int("timeline_months"),
  userFeedback: mysqlEnum("user_feedback", ["positive", "neutral", "negative"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MarketRecommendation = typeof marketRecommendations.$inferSelect;
export type InsertMarketRecommendation = typeof marketRecommendations.$inferInsert;

/**
 * Usage Analytics table
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
 * Scoring Adjustments table
 */
export const scoringAdjustments = mysqlTable("scoring_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  country: varchar("country", { length: 255 }).notNull(),
  originalScore: decimal("original_score", { precision: 5, scale: 2 }).notNull(),
  adjustedScore: decimal("adjusted_score", { precision: 5, scale: 2 }).notNull(),
  adjustmentReason: varchar("adjustment_reason", { length: 255 }).notNull(),
  dataPoints: int("data_points").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ScoringAdjustment = typeof scoringAdjustments.$inferSelect;
export type InsertScoringAdjustment = typeof scoringAdjustments.$inferInsert;