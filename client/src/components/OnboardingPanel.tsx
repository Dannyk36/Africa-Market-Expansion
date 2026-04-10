import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Database, KeyRound, Rocket, Settings, ShieldCheck } from "lucide-react";

type DashboardTab = "start" | "rankings" | "analysis" | "atlas" | "advisor" | "watchlist" | "trust" | "settings";

type OnboardingPanelProps = {
  goToTab: (tab: DashboardTab) => void;
};

export function OnboardingPanel({ goToTab }: OnboardingPanelProps) {
  const statusQuery = trpc.system.status.useQuery();
  const status = statusQuery.data;

  const setupItems = [
    {
      title: "Use the market rankings",
      description: "This works right away. You can browse countries, compare regions, and inspect scores without setting anything up.",
      icon: Rocket,
      actionLabel: "Open Rankings",
      action: () => goToTab("rankings"),
      status: "Ready now",
    },
    {
      title: "Turn on saved memory",
      description: "To save chat history, settings, trusted data, and ranking updates, connect a MySQL database once.",
      icon: Database,
      actionLabel: "Open Settings",
      action: () => goToTab("settings"),
      status: status?.databaseConfigured ? "Connected" : "Needs setup",
    },
    {
      title: "Connect an AI model",
      description: "Add the model you want the AI Advisor to use. OpenAI uses API keys. Other providers may support token-based sign-in.",
      icon: KeyRound,
      actionLabel: "Set Up AI",
      action: () => goToTab("settings"),
      status: "Optional",
    },
    {
      title: "Sign into the app",
      description: "Login protects your saved data and lets one user keep their own keys, history, and preferences.",
      icon: ShieldCheck,
      actionLabel: "Auth Settings",
      action: () => goToTab("settings"),
      status: status?.oauthConfigured ? "Available" : "Optional",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/15 p-3">
            <Settings className="size-6 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Start Here</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              This app helps you compare African markets, ask an AI advisor for strategy help, and track trusted policy and trade signals. You do not need to set up everything at once. Start with rankings, then add AI and saving when you are ready.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {setupItems.map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-slate-700 bg-slate-800/50 p-5">
              <div className="flex items-center justify-between gap-3">
                <Icon className="size-5 text-amber-400" />
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {item.status}
                </Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 min-h-24 text-sm leading-6 text-slate-400">{item.description}</p>
              <Button
                type="button"
                onClick={item.action}
                className="mt-4 w-full bg-amber-500 text-black hover:bg-amber-400"
              >
                {item.actionLabel}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-3">
            <Database className="size-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">How To Turn On Saving</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              The app can run without a database, but it cannot remember things without one.
            </p>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p className="font-medium text-white">Do this once on your computer:</p>
              <p className="mt-2">1. Open the project folder.</p>
              <p>2. Copy `.env.example` to `.env`.</p>
              <p>3. Put your MySQL connection into `DATABASE_URL`.</p>
              <p>4. Run `corepack pnpm run db:push`.</p>
            </div>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-slate-400">
              Browser apps cannot safely create and configure a local MySQL server for you. That part still has to be done on the machine once.
            </div>
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">How AI Login Works</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              Different AI providers authenticate in different ways.
            </p>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p><span className="font-medium text-white">OpenAI / Codex:</span> API key required in this app.</p>
              <p className="mt-2"><span className="font-medium text-white">Google or Microsoft:</span> these can support token-style sign-in flows, but they still need provider-specific backend wiring.</p>
              <p className="mt-2"><span className="font-medium text-white">OpenRouter:</span> works best with a provider key here.</p>
            </div>
            <Button
              type="button"
              onClick={() => goToTab("advisor")}
              variant="outline"
              className="w-full"
            >
              Open AI Advisor
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
