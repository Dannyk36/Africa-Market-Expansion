import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { countryScores, getScoreColor, regionColors, type CountryScore } from "@/lib/marketData";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

type CountryIntelligencePanelProps = {
  country: CountryScore | null;
  onSelectCountry: (country: string) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (country: string) => void;
};

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function buildValidationChecklist(country: CountryScore) {
  const checks: string[] = [];

  if (country.gdpGrowth >= 5) {
    checks.push("Validate whether current GDP growth is broad-based or concentrated in one sector.");
  } else {
    checks.push("Check whether slow growth is cyclical or tied to deeper structural constraints.");
  }

  if (country.businessReady < 45) {
    checks.push("Confirm incorporation, licensing, and customs friction with local counsel before entry.");
  }

  if (country.corruption < 35) {
    checks.push("Plan stronger compliance controls and local partner diligence.");
  }

  if (country.idi < 45) {
    checks.push("Stress-test digital channel assumptions and last-mile distribution realities.");
  }

  if (country.debtToGdp > 85) {
    checks.push("Watch fiscal pressure, FX risk, and sudden policy shifts linked to debt stress.");
  }

  if (checks.length < 4) {
    checks.push("Interview at least three in-market operators before finalizing the go-to-market plan.");
  }

  return checks;
}

function buildOpportunityNarrative(country: CountryScore) {
  const strengths: string[] = [];

  if (country.gdpGrowth >= 5) strengths.push("strong economic growth");
  if (country.businessReady >= 55) strengths.push("better operating conditions");
  if (country.idi >= 60) strengths.push("stronger digital readiness");
  if (country.urbanization >= 55) strengths.push("large urban demand concentration");
  if (country.corruption >= 45) strengths.push("relatively stronger governance signals");

  if (strengths.length === 0) {
    return "This market may still be viable, but the opportunity case depends more on niche positioning, timing, and local execution than on broad structural strength.";
  }

  return `The current opportunity case is driven by ${strengths.join(", ")}.`;
}

export function CountryIntelligencePanel({ country, onSelectCountry, isInWatchlist, onToggleWatchlist }: CountryIntelligencePanelProps) {
  const adjustedRankingsQuery = trpc.insights.adjustedRankings.useQuery({ limit: 54 });
  const eventsQuery = trpc.insights.listEvents.useQuery(
    { limit: 8, country: country?.name },
    { enabled: Boolean(country?.name) }
  );

  const adjustedCountry = useMemo(
    () => adjustedRankingsQuery.data?.find(item => item.country === country?.name),
    [adjustedRankingsQuery.data, country?.name]
  );

  const peerMarkets = useMemo(() => {
    if (!country) return [];
    return countryScores
      .filter(item => item.region === country.region && item.name !== country.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [country]);

  if (!country) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
        <p className="text-slate-400 text-lg">Pick a country from Rankings or Market Atlas to open country intelligence.</p>
      </Card>
    );
  }

  const swotData = [
    { name: "Strengths", value: country.strengths, fill: "#22c55e" },
    { name: "Opportunities", value: country.opportunities, fill: "#3b82f6" },
    { name: "Weaknesses", value: country.weaknesses, fill: "#f97316" },
    { name: "Threats", value: country.threats, fill: "#ef4444" },
  ];

  const indicatorData = [
    { label: "Expansion Score", value: country.score, color: getScoreColor(country.score) },
    { label: "Business Readiness", value: country.businessReady, color: "#fbbf24" },
    { label: "Digital Readiness", value: country.idi, color: "#38bdf8" },
    { label: "Governance", value: country.corruption, color: "#34d399" },
    { label: "Urbanization", value: country.urbanization, color: "#c084fc" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-bold text-white">{country.name}</h3>
                <Badge
                  variant="outline"
                  className="border-slate-600"
                  style={{
                    backgroundColor: `${regionColors[country.region]}20`,
                    borderColor: regionColors[country.region],
                    color: regionColors[country.region],
                  }}
                >
                  {country.region}
                </Badge>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                {buildOpportunityNarrative(country)} Use this page to understand the country signal, compare nearby markets, and see which questions still need validation before investment.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant={isInWatchlist ? "outline" : "default"}
                  onClick={() => onToggleWatchlist(country.name)}
                  className={isInWatchlist ? "" : "bg-amber-500 text-black hover:bg-amber-400"}
                >
                  {isInWatchlist ? "Remove From Watchlist" : "Add To Watchlist"}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">Base Rank</p>
              <p className="text-2xl font-bold text-white">#{country.rank}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Base Score</p>
              <div
                className="mt-2 inline-block rounded-lg px-3 py-2 text-xl font-bold text-white"
                style={{ backgroundColor: getScoreColor(country.score) }}
              >
                {country.score.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Adjusted Score</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {adjustedCountry ? adjustedCountry.adjustedScore.toFixed(2) : country.score.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Event adjustment {adjustedCountry ? formatSigned(adjustedCountry.adjustment) : "+0.00"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Event Count</p>
              <p className="mt-2 text-2xl font-bold text-white">{adjustedCountry?.eventCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Recent trusted-source signals</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {indicatorData.map(item => (
              <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <span className="text-sm font-medium text-white">{item.value.toFixed(1)}</span>
                </div>
                <Progress
                  value={Math.max(0, Math.min(100, item.value))}
                  className="mt-3 bg-slate-700"
                  style={{ ["--primary" as any]: item.color }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h4 className="text-lg font-semibold text-white">Signal Breakdown</h4>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={swotData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                <Tooltip
                  cursor={{ fill: "rgba(51,65,85,0.2)" }}
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 12 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Strengths and opportunities help explain upside. Weaknesses and threats help define execution risk and what should be validated first.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h4 className="text-lg font-semibold text-white">Recent Country Events</h4>
          <div className="mt-4">
            <ScrollArea className="h-[360px]">
              <div className="space-y-3 pr-4">
                {eventsQuery.data?.length ? (
                  eventsQuery.data.map(event => (
                    <div key={event.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{event.title}</p>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {event.eventType}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{event.summary}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Impact: {event.impactDirection} | Confidence: {Number(event.confidence).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                    No recent trusted-source events are stored for this country yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h4 className="text-lg font-semibold text-white">Validation Checklist</h4>
          <div className="mt-4 space-y-3">
            {buildValidationChecklist(country).map(item => (
              <div key={item} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h4 className="text-lg font-semibold text-white">Regional Peers</h4>
        <p className="mt-2 text-sm text-slate-400">
          Compare this market with nearby alternatives in the same region.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {peerMarkets.map(peer => (
            <button
              key={peer.name}
              type="button"
              onClick={() => onSelectCountry(peer.name)}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-left transition-colors hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{peer.name}</p>
                <Badge
                  className="text-white"
                  style={{ backgroundColor: getScoreColor(peer.score) }}
                >
                  {peer.score.toFixed(1)}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">Rank #{peer.rank}</p>
              <p className="mt-3 text-sm text-slate-400">
                GDP {peer.gdpGrowth.toFixed(1)}% | Business {peer.businessReady.toFixed(1)} | Digital {peer.idi.toFixed(1)}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
