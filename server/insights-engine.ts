import { invokeLLM } from "./_core/llm";
import { createInsightEvent, createSourceDocument, findLatestSourceDocumentByUrl, getSourceConfig, listRecentInsightEvents, listSourceConfigs, upsertSourceConfig } from "./db-helpers";
import { countryScores } from "../client/src/lib/marketData";

export const trustedSourceCatalog = [
  {
    id: "world-bank",
    name: "World Bank Data",
    kind: "dataset",
    url: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation",
    notes: "Core macroeconomic and development indicators.",
  },
  {
    id: "imf",
    name: "IMF Data",
    kind: "dataset",
    url: "https://www.imf.org/en/Data",
    notes: "Macroeconomic series and country reports.",
  },
  {
    id: "wto",
    name: "WTO Data Portal",
    kind: "dataset",
    url: "https://data.wto.org/",
    notes: "Trade flows, tariff, and multilateral trade statistics.",
  },
  {
    id: "unctad",
    name: "UNCTAD Statistics",
    kind: "dataset",
    url: "https://unctad.org/statistics",
    notes: "Investment, trade, and development indicators.",
  },
  {
    id: "un-comtrade",
    name: "UN Comtrade",
    kind: "dataset",
    url: "https://comtradedeveloper.un.org/apis",
    notes: "Official goods trade data by partner and product.",
  },
  {
    id: "african-union",
    name: "African Union Treaties and Releases",
    kind: "official_release",
    url: "https://au.int/en/treaties-protocols-and-conventions",
    notes: "Treaty, protocol, and official union-level developments.",
  },
  {
    id: "east-african-community",
    name: "East African Community Releases",
    kind: "official_release",
    url: "https://www.eac.int/press-releases",
    notes: "Regional integration, membership, policy, and trade updates.",
  },
  {
    id: "comesa",
    name: "COMESA Releases",
    kind: "official_release",
    url: "https://www.comesa.int/press-statements-releases/",
    notes: "Trade bloc policy and treaty developments.",
  },
  {
    id: "afcfta",
    name: "AfCFTA",
    kind: "official_release",
    url: "https://au-afcfta.org/",
    notes: "Continental trade agreement news and protocol updates.",
  },
] as const;

export async function ensureSourceConfigs() {
  const existing = await listSourceConfigs();
  const existingIds = new Set(existing.map(item => item.sourceId));

  for (const source of trustedSourceCatalog) {
    if (existingIds.has(source.id)) continue;
    await upsertSourceConfig({
      sourceId: source.id,
      sourceName: source.name,
      enabled: true,
      intervalHours: source.kind === "dataset" ? 168 : 24,
      lastStatus: "idle",
    });
  }

  return listSourceConfigs();
}

export type ExtractedInsight = {
  country: string;
  eventType:
    | "treaty"
    | "trade_deal"
    | "policy_change"
    | "geopolitics"
    | "market_signal"
    | "infrastructure"
    | "regulatory"
    | "macro";
  title: string;
  summary: string;
  impactDirection: "positive" | "neutral" | "negative" | "mixed";
  impactScore: number;
  confidence: number;
  effectiveDate?: string;
  expiresAt?: string;
  tags?: string[];
};

export async function extractInsightsFromSource(params: {
  sourceName: string;
  title: string;
  sourceUrl: string;
  rawText: string;
  regionScope?: string;
  countryCodes?: string[];
}) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You extract high-signal market insight events from trusted policy, trade, and macroeconomic source documents.
Return only concrete events that could change a country's investability, trade posture, regulatory attractiveness, market access, or geopolitical risk.
Be conservative and unbiased. Ignore weak marketing language. Use "mixed" when the effect is not one-directional.`,
      },
      {
        role: "user",
        content: `Source: ${params.sourceName}
Title: ${params.title}
URL: ${params.sourceUrl}
Region: ${params.regionScope || "unknown"}
Country hints: ${(params.countryCodes || []).join(", ") || "none"}

Document:
${params.rawText.slice(0, 16000)}

Extract a JSON array of events with:
country, eventType, title, summary, impactDirection, impactScore, confidence, effectiveDate, expiresAt, tags`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "insight_events",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              country: { type: "string" },
              eventType: {
                type: "string",
                enum: [
                  "treaty",
                  "trade_deal",
                  "policy_change",
                  "geopolitics",
                  "market_signal",
                  "infrastructure",
                  "regulatory",
                  "macro",
                ],
              },
              title: { type: "string" },
              summary: { type: "string" },
              impactDirection: {
                type: "string",
                enum: ["positive", "neutral", "negative", "mixed"],
              },
              impactScore: { type: "number" },
              confidence: { type: "number" },
              effectiveDate: { type: "string" },
              expiresAt: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "country",
              "eventType",
              "title",
              "summary",
              "impactDirection",
              "impactScore",
              "confidence",
              "effectiveDate",
              "expiresAt",
              "tags",
            ],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") return [] as ExtractedInsight[];

  const parsed = JSON.parse(content) as ExtractedInsight[];
  return parsed.map(item => ({
    ...item,
    impactScore: Math.max(-5, Math.min(5, item.impactScore)),
    confidence: Math.max(0, Math.min(1, item.confidence)),
  }));
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTrustedSource(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "AfricaMarketExpansionBot/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return {
      title: titleMatch?.[1]?.trim() || url,
      rawText: stripHtml(html).slice(0, 20000),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshTrustedSources(sourceIds?: string[]) {
  await ensureSourceConfigs();
  const now = new Date();
  const results: Array<{
    sourceId: string;
    source: string;
    status: "ingested" | "skipped" | "failed";
    reason?: string;
    eventsExtracted?: number;
  }> = [];
  const enabledConfigs = await listSourceConfigs();
  const targetSources = trustedSourceCatalog.filter(source => {
    const config = enabledConfigs.find(item => item.sourceId === source.id);
    if (!config?.enabled) return false;
    if (sourceIds?.length) return sourceIds.includes(source.id);
    return true;
  });

  for (const source of targetSources) {
    const config = await getSourceConfig(source.id);
    try {
      const existing = await findLatestSourceDocumentByUrl(source.url);
      if (
        !sourceIds?.length &&
        existing?.retrievedAt &&
        config?.intervalHours &&
        now.getTime() - new Date(existing.retrievedAt).getTime() < 1000 * 60 * 60 * config.intervalHours
      ) {
        const nextRunAt = new Date(new Date(existing.retrievedAt).getTime() + config.intervalHours * 60 * 60 * 1000);
        await upsertSourceConfig({
          sourceId: source.id,
          sourceName: source.name,
          enabled: config.enabled,
          intervalHours: config.intervalHours,
          lastRunAt: existing.retrievedAt,
          nextRunAt,
          lastStatus: "success",
          lastMessage: "Skipped because source is still fresh",
        });
        results.push({
          sourceId: source.id,
          source: source.name,
          status: "skipped",
          reason: "Fetched within the last 12 hours",
        });
        continue;
      }

      const fetched = await fetchTrustedSource(source.url);
      const sourceDocumentId = await createSourceDocument({
        sourceName: source.name,
        sourceType:
          source.kind === "dataset"
            ? "dataset"
            : "official_release",
        sourceUrl: source.url,
        title: fetched.title,
        regionScope: "Africa",
        countryCodes: [],
        publishedAt: null,
        trustScore: "1.00" as any,
        rawText: fetched.rawText,
      });

      const extracted = await extractInsightsFromSource({
        sourceName: source.name,
        title: fetched.title,
        sourceUrl: source.url,
        rawText: fetched.rawText,
        regionScope: "Africa",
        countryCodes: [],
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
      }

      const intervalHours = config?.intervalHours || (source.kind === "dataset" ? 168 : 24);
      await upsertSourceConfig({
        sourceId: source.id,
        sourceName: source.name,
        enabled: config?.enabled ?? true,
        intervalHours,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + intervalHours * 60 * 60 * 1000),
        lastStatus: "success",
        lastMessage: `Stored source document and extracted ${extracted.length} events`,
      });

      results.push({
        sourceId: source.id,
        source: source.name,
        status: "ingested",
        eventsExtracted: extracted.length,
      });
    } catch (error) {
      const intervalHours = config?.intervalHours || (source.kind === "dataset" ? 168 : 24);
      await upsertSourceConfig({
        sourceId: source.id,
        sourceName: source.name,
        enabled: config?.enabled ?? true,
        intervalHours,
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + intervalHours * 60 * 60 * 1000),
        lastStatus: "failed",
        lastMessage: error instanceof Error ? error.message : "Unknown error",
      });
      results.push({
        sourceId: source.id,
        source: source.name,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    startedAt: now.toISOString(),
    completedAt: new Date().toISOString(),
    results,
  };
}

export async function refreshDueTrustedSources() {
  await ensureSourceConfigs();
  const configs = await listSourceConfigs();
  const now = new Date();
  const dueIds = configs
    .filter(config => {
      if (!config.enabled) return false;
      if (!config.nextRunAt) return true;
      return new Date(config.nextRunAt).getTime() <= now.getTime();
    })
    .map(config => config.sourceId);

  if (dueIds.length === 0) {
    return {
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      results: [],
    };
  }

  return refreshTrustedSources(dueIds);
}

export async function computeAdjustedRankings(limit = 20) {
  const events = await listRecentInsightEvents(500);
  const impactByCountry = new Map<string, { impact: number; count: number }>();

  for (const event of events) {
    const current = impactByCountry.get(event.country) || { impact: 0, count: 0 };
    const weightedImpact =
      Number(event.impactScore || 0) * Number(event.confidence || 0.5);
    current.impact += weightedImpact;
    current.count += 1;
    impactByCountry.set(event.country, current);
  }

  const adjusted = countryScores.map(country => {
    const eventImpact = impactByCountry.get(country.name);
    const adjustment = eventImpact ? Math.max(-7.5, Math.min(7.5, eventImpact.impact)) : 0;
    const adjustedScore = Number((country.score + adjustment).toFixed(2));
    return {
      country: country.name,
      region: country.region,
      baseScore: country.score,
      adjustedScore,
      adjustment: Number(adjustment.toFixed(2)),
      eventCount: eventImpact?.count || 0,
    };
  });

  return adjusted
    .sort((a, b) => b.adjustedScore - a.adjustedScore)
    .slice(0, limit);
}
