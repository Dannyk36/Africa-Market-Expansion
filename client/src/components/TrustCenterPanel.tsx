import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Database, ShieldCheck, Sparkles, BookOpen } from "lucide-react";

function formatDate(value: unknown) {
  if (!value) return "Never";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export function TrustCenterPanel() {
  const statusQuery = trpc.system.status.useQuery();
  const sourceCatalogQuery = trpc.insights.sourceCatalog.useQuery();
  const sourceConfigsQuery = trpc.insights.listSourceConfigs.useQuery();
  const recentEventsQuery = trpc.insights.listEvents.useQuery({ limit: 8 });

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-500/15 p-3">
            <ShieldCheck className="size-6 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Trust Center</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              This page explains where the platform gets its signals, how rankings are interpreted, and how the AI should be used. The goal is simple: help a user understand what is fact, what is inference, and what still needs validation.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-700 bg-slate-800/50 p-5">
          <Database className="size-5 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-white">How Ranking Works</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Each country starts with a base score from the core market dataset. Trusted-source events can then push that score up or down in a limited way, based on event impact and confidence.
          </p>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-5">
          <Sparkles className="size-5 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-white">How To Use The AI</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Treat the AI advisor as a decision-support analyst, not a source of truth by itself. The best use is to combine your company context with the market dataset and recent official-source developments.
          </p>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-5">
          <BookOpen className="size-5 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-white">How To Validate</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            High-confidence decisions should still be checked against primary sources, local counsel, current regulation, and in-market operator feedback before capital is committed.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white">Methodology</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p className="font-medium text-white">1. Base market score</p>
              <p className="mt-2 leading-6 text-slate-400">
                The platform starts from structured indicators like GDP growth, business readiness, digital adoption, governance, urbanization, and debt burden.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p className="font-medium text-white">2. Trusted-source events</p>
              <p className="mt-2 leading-6 text-slate-400">
                Official releases and trusted institutional sources are fetched, stored, and converted into country-level events such as policy changes, trade deals, treaty moves, macro developments, and regulatory signals.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p className="font-medium text-white">3. Bounded adjustment</p>
              <p className="mt-2 leading-6 text-slate-400">
                Event signals do not replace the base score. They act as a bounded adjustment layer so a single headline cannot completely distort a country ranking.
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4">
              <p className="font-medium text-white">Current limitation</p>
              <p className="mt-2 leading-6 text-slate-400">
                Some trusted-source ingestion is still driven by general webpage parsing. For full reliability, the next improvement is source-specific adapters for each institution and treaty body.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white">System Status</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <span className="text-sm text-slate-300">Database</span>
              <Badge className={statusQuery.data?.databaseConfigured ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-amber-600 text-white hover:bg-amber-600"}>
                {statusQuery.data?.databaseConfigured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <span className="text-sm text-slate-300">Database connection</span>
              <Badge className={statusQuery.data?.databaseAvailable ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-slate-700 text-white hover:bg-slate-700"}>
                {statusQuery.data?.databaseAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <span className="text-sm text-slate-300">OAuth</span>
              <Badge className={statusQuery.data?.oauthConfigured ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-slate-700 text-white hover:bg-slate-700"}>
                {statusQuery.data?.oauthConfigured ? "Configured" : "Optional"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white">Trusted Sources</h3>
          <div className="mt-4 space-y-3">
            {sourceCatalogQuery.data?.map(source => {
              const config = sourceConfigsQuery.data?.find(item => item.sourceId === source.id);
              return (
                <div
                  key={source.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{source.name}</p>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {source.kind}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{source.notes}</p>
                  <p className="mt-2 text-xs break-all text-slate-500">{source.url}</p>
                  {config ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Last run: {formatDate(config.lastRunAt)} | Next run: {formatDate(config.nextRunAt)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <h3 className="text-lg font-semibold text-white">Recent Event Signals</h3>
          <div className="mt-4 space-y-3">
            {recentEventsQuery.data?.length ? (
              recentEventsQuery.data.map(event => (
                <div
                  key={event.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                >
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
              <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No trusted events are stored yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
