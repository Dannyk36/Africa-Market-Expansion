import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  apiKeys,
  userPreferences,
  queryHistory,
  feedback,
  investmentOutcomes,
  companyProfiles,
  marketRecommendations,
  usageAnalytics,
  InsertApiKey,
  InsertUserPreference,
  InsertQueryHistory,
  InsertFeedback,
  InsertInvestmentOutcome,
  InsertCompanyProfile,
  InsertMarketRecommendation,
  InsertUsageAnalytic,
} from "../drizzle/schema";
import { encryptData, decryptData } from "./crypto";

/**
 * API Keys Management
 */
export async function addApiKey(userId: number, key: Omit<InsertApiKey, 'userId'>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const encryptedKey = encryptData(key.encryptedKey);

  await db.insert(apiKeys).values({
    ...key,
    userId,
    encryptedKey: encryptedKey,
  });
}

export async function getApiKey(userId: number, keyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.id, keyId)))
    .limit(1);

  if (result.length === 0) return null;

  const key = result[0];
  return {
    ...key,
    encryptedKey: decryptData(key.encryptedKey),
  };
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

  return keys.map((k) => ({
    ...k,
    encryptedKey: decryptData(k.encryptedKey),
  }));
}

export async function deleteApiKey(userId: number, keyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.id, keyId)));
}

/**
 * User Preferences Management
 */
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createUserPreferences(userId: number, prefs: Omit<InsertUserPreference, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userPreferences).values({
    ...prefs,
    userId,
  });
}

export async function updateUserPreferences(userId: number, prefs: Partial<Omit<InsertUserPreference, "userId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userPreferences).set(prefs).where(eq(userPreferences.userId, userId));
}

/**
 * Query History Management
 */
export async function saveQuery(userId: number, query: InsertQueryHistory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(queryHistory).values({
    ...query,
    userId,
  });

  return (result as any).insertId as number;
}

export async function getUserQueryHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(queryHistory).where(eq(queryHistory.userId, userId)).limit(limit);
}

/**
 * Feedback Management
 */
export async function submitFeedback(userId: number, fb: InsertFeedback): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(feedback).values({
    ...fb,
    userId,
  });
}

export async function getUserFeedback(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(feedback).where(eq(feedback.userId, userId));
}

/**
 * Investment Outcomes Management
 */
export async function recordInvestmentOutcome(userId: number, outcome: InsertInvestmentOutcome): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(investmentOutcomes).values({
    ...outcome,
    userId,
  });
}

export async function getUserInvestmentOutcomes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(investmentOutcomes).where(eq(investmentOutcomes.userId, userId));
}

/**
 * Company Profiles Management
 */
export async function createCompanyProfile(userId: number, profile: InsertCompanyProfile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(companyProfiles).values({
    ...profile,
    userId,
  });

  return (result as any).insertId as number;
}

export async function getUserCompanyProfiles(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(companyProfiles).where(eq(companyProfiles.userId, userId));
}

export async function getCompanyProfile(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(companyProfiles)
    .where(and(eq(companyProfiles.userId, userId), eq(companyProfiles.id, profileId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Market Recommendations Management
 */
export async function createMarketRecommendation(userId: number, rec: InsertMarketRecommendation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(marketRecommendations).values({
    ...rec,
    userId,
  });

  return (result as any).insertId as number;
}

export async function getMarketRecommendations(userId: number, companyProfileId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (companyProfileId) {
    return db
      .select()
      .from(marketRecommendations)
      .where(
        and(
          eq(marketRecommendations.userId, userId),
          eq(marketRecommendations.companyProfileId, companyProfileId)
        )
      );
  }

  return db.select().from(marketRecommendations).where(eq(marketRecommendations.userId, userId));
}

/**
 * Usage Analytics Management
 */
export async function recordUsage(userId: number, usage: InsertUsageAnalytic): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(usageAnalytics).values({
    ...usage,
    userId,
  });
}

export async function getUserUsageAnalytics(userId: number, daysBack = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - daysBack);

  return db
    .select()
    .from(usageAnalytics)
    .where(and(eq(usageAnalytics.userId, userId)));
}
