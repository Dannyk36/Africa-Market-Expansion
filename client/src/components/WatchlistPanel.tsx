import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { countryScores, getScoreColor } from "@/lib/marketData";

type WatchlistPanelProps = {
  watchlist: string[];
  onSelectCountry: (country: string) => void;
  onRemoveCountry: (country: string) => void;
};

export function WatchlistPanel({ watchlist, onSelectCountry, onRemoveCountry }: WatchlistPanelProps) {
  const eventsQuery = trpc.insights.listEvents.useQuery({ limit: 50 });

  const countries = useMemo(
    () =>
      watchlist
        .map(name => countryScores.find(country => country.name === name))
        .filter(Boolean),
    [watchlist]
  );

  const watchlistEvents = useMemo(
    () => (eventsQuery.data || []).filter(event => watchlist.includes(event.country)).slice(0, 12),
    [eventsQuery.data, watchlist]
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <h3 className="text-xl font-semibold text-white">Watchlist</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Save countries you want to track, then come back to see their current score and recent trusted-source developments.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h4 className="text-lg font-semibold text-white">Saved Countries</h4>
          <div className="mt-4 space-y-3">
            {countries.length ? (
              countries.map(country => {
                if (!country) return null;
                return (
                  <div key={country.name} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{country.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{country.region}</p>
                      </div>
                      <Badge className="text-white" style={{ backgroundColor: getScoreColor(country.score) }}>
                        {country.score.toFixed(1)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Rank #{country.rank} | GDP {country.gdpGrowth.toFixed(1)}% | Business {country.businessReady.toFixed(1)}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button type="button" onClick={() => onSelectCountry(country.name)} className="bg-amber-500 text-black hover:bg-amber-400">
                        Open Analysis
                      </Button>
                      <Button type="button" variant="outline" onClick={() => onRemoveCountry(country.name)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No countries saved yet. Add a country from the country intelligence page.
              </div>
            )}
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h4 className="text-lg font-semibold text-white">Recent Watchlist Events</h4>
          <div className="mt-4 space-y-3">
            {watchlistEvents.length ? (
              watchlistEvents.map(event => (
                <div key={event.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{event.country}</p>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {event.eventType}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{event.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{event.summary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No recent trusted-source updates for your watchlist yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
