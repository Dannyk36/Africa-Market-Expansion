import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, KeyRound, LogIn, LogOut, Save, Shield, Trash2 } from "lucide-react";

const llmProviders = [
  {
    value: "openrouter",
    backendProvider: "openrouter",
    label: "OpenRouter",
    authLabel: "API key, OAuth-capable flow",
    note: "Useful when you want one key across many upstream models. OpenRouter docs note their keys can be used in OAuth flows.",
  },
  {
    value: "openai",
    backendProvider: "openai",
    label: "OpenAI / Codex",
    authLabel: "API key",
    note: "OpenAI platform access is API-key based. Use this for GPT and Codex-style OpenAI usage.",
  },
  {
    value: "google",
    backendProvider: "custom",
    label: "Google Gemini / Vertex AI",
    authLabel: "OAuth or API key",
    note: "Google supports OAuth-based auth for Gemini and ADC for Vertex AI. Use Custom base URLs until a dedicated server adapter is added.",
  },
  {
    value: "azure-openai",
    backendProvider: "custom",
    label: "Azure OpenAI",
    authLabel: "Microsoft Entra ID or API key",
    note: "Azure OpenAI supports Microsoft Entra ID bearer tokens. Use Custom base URLs for now.",
  },
  {
    value: "anthropic",
    backendProvider: "anthropic",
    label: "Anthropic",
    authLabel: "API key",
    note: "Anthropic API access is key-based.",
  },
  {
    value: "cohere",
    backendProvider: "cohere",
    label: "Cohere",
    authLabel: "API key",
    note: "Cohere is key-based in this app.",
  },
  {
    value: "custom",
    backendProvider: "custom",
    label: "Custom Provider",
    authLabel: "Custom bearer token or API key",
    note: "Use this for any OpenAI-compatible endpoint or vendor-specific base URL.",
  },
] as const;

const authProviders = [
  { value: "manus", label: "Manus OAuth" },
  { value: "openrouter-oauth", label: "OpenRouter OAuth" },
  { value: "google", label: "Google OAuth" },
  { value: "microsoft", label: "Microsoft Entra ID" },
  { value: "custom-oidc", label: "Custom OIDC" },
] as const;

type LlmProvider = "openrouter" | "openai" | "anthropic" | "cohere" | "custom";
type LlmProviderOption = (typeof llmProviders)[number]["value"];
type AuthProvider = (typeof authProviders)[number]["value"];
type CredentialType = "api-key" | "oauth-token" | "entra-token";

const preferenceProviderOptions: Array<{ value: LlmProvider; label: string }> = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI / Codex" },
  { value: "anthropic", label: "Anthropic" },
  { value: "cohere", label: "Cohere" },
  { value: "custom", label: "Custom / OAuth-backed endpoint" },
];

const providerPresets: Partial<Record<LlmProviderOption, string>> = {
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  "azure-openai": "https://YOUR_RESOURCE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT",
  custom: "https://api.example.com/v1",
};

function formatDate(value: unknown) {
  if (!value) return "Never";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export function SettingsPanel() {
  const utils = trpc.useUtils();
  const auth = useAuth();
  const loginUrl = getLoginUrl();
  const systemStatusQuery = trpc.system.status.useQuery();

  const keysQuery = trpc.apiKeys.list.useQuery(undefined, {
    enabled: auth.isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const preferencesQuery = trpc.preferences.get.useQuery(undefined, {
    enabled: auth.isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const addKeyMutation = trpc.apiKeys.add.useMutation();
  const testKeyMutation = trpc.apiKeys.test.useMutation();
  const deleteKeyMutation = trpc.apiKeys.delete.useMutation();
  const updatePreferencesMutation = trpc.preferences.update.useMutation();
  const refreshSourcesMutation = trpc.insights.runRefresh.useMutation();
  const sourcesQuery = trpc.insights.listSources.useQuery({ limit: 6 });
  const eventsQuery = trpc.insights.listEvents.useQuery({ limit: 6 });
  const sourceConfigsQuery = trpc.insights.listSourceConfigs.useQuery();
  const adjustedRankingsQuery = trpc.insights.adjustedRankings.useQuery({ limit: 8 });
  const updateSourceConfigMutation = trpc.insights.updateSourceConfig.useMutation();

  const [providerSelection, setProviderSelection] = useState<LlmProviderOption>("openrouter");
  const [credentialType, setCredentialType] = useState<CredentialType>("api-key");
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const [preferredProvider, setPreferredProvider] = useState<LlmProvider>("openrouter");
  const [preferredModel, setPreferredModel] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("2000");
  const [usageQuota, setUsageQuota] = useState("10000");
  const [enableFeedback, setEnableFeedback] = useState(true);
  const [enableOutcomeTracking, setEnableOutcomeTracking] = useState(true);
  const [authProvider, setAuthProvider] = useState<AuthProvider>(() => {
    if (typeof window === "undefined") return "manus";
    const stored = window.localStorage.getItem("preferred-auth-provider");
    return (stored as AuthProvider) || "manus";
  });

  useEffect(() => {
    const prefs = preferencesQuery.data;
    if (!prefs) return;

    if (prefs.preferredProvider) {
      setPreferredProvider(prefs.preferredProvider);
    }
    setPreferredModel(prefs.preferredModel || "");
    setTemperature(String(prefs.defaultTemperature ?? "0.7"));
    setMaxTokens(String(prefs.defaultMaxTokens ?? 2000));
    setUsageQuota(String(prefs.usageQuota ?? 10000));
    setEnableFeedback(Boolean(prefs.enableFeedback));
    setEnableOutcomeTracking(Boolean(prefs.enableOutcomeTracking));
  }, [preferencesQuery.data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("preferred-auth-provider", authProvider);
  }, [authProvider]);

  const selectedProvider = llmProviders.find(option => option.value === providerSelection) || llmProviders[0];
  const credentialOptions: Array<{ value: CredentialType; label: string }> =
    providerSelection === "google"
      ? [
          { value: "oauth-token", label: "OAuth Access Token" },
          { value: "api-key", label: "API Key" },
        ]
      : providerSelection === "azure-openai"
        ? [
            { value: "entra-token", label: "Microsoft Entra Token" },
            { value: "api-key", label: "API Key" },
          ]
        : providerSelection === "openrouter"
          ? [
              { value: "api-key", label: "API Key" },
              { value: "oauth-token", label: "OAuth Access Token" },
            ]
          : providerSelection === "custom"
            ? [
                { value: "api-key", label: "API Key" },
                { value: "oauth-token", label: "Bearer / OAuth Token" },
              ]
            : [{ value: "api-key", label: "API Key" }];

  useEffect(() => {
    const preset = providerPresets[providerSelection];
    if (!preset) return;
    if (!baseUrl) {
      setBaseUrl(preset);
    }
  }, [providerSelection]);

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "";
  const appId = import.meta.env.VITE_APP_ID || "";
  const callbackUrl =
    typeof window === "undefined"
      ? "/api/oauth/callback"
      : `${window.location.origin}/api/oauth/callback`;

  const handleSaveApiKey = async () => {
    if (!keyName.trim() || !apiKey.trim()) {
      toast.error("Enter a key name and API key first.");
      return;
    }

    try {
      await addKeyMutation.mutateAsync({
        provider: selectedProvider.backendProvider,
        credentialType:
          credentialType === "api-key"
            ? "api_key"
            : credentialType === "entra-token"
              ? "entra_token"
              : "oauth_token",
        name: keyName.trim(),
        apiKey: apiKey.trim(),
        baseUrl: selectedProvider.backendProvider === "custom" ? baseUrl.trim() || undefined : undefined,
      });
      toast.success("API key saved.");
      setKeyName("");
      setApiKey("");
      setBaseUrl("");
      await utils.apiKeys.list.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save API key.");
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Paste an API key to test.");
      return;
    }

    const result = await testKeyMutation.mutateAsync({
      provider: selectedProvider.backendProvider,
      credentialType:
        credentialType === "api-key"
          ? "api_key"
          : credentialType === "entra-token"
            ? "entra_token"
            : "oauth_token",
      apiKey: apiKey.trim(),
      baseUrl: selectedProvider.backendProvider === "custom" ? baseUrl.trim() || undefined : undefined,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    try {
      await deleteKeyMutation.mutateAsync({ keyId });
      toast.success("API key deleted.");
      await utils.apiKeys.list.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete API key.");
    }
  };

  const handleSavePreferences = async () => {
    const parsedTemperature = Number(temperature);
    const parsedMaxTokens = Number(maxTokens);
    const parsedUsageQuota = Number(usageQuota);

    if (Number.isNaN(parsedTemperature) || Number.isNaN(parsedMaxTokens) || Number.isNaN(parsedUsageQuota)) {
      toast.error("Preferences must use valid numeric values.");
      return;
    }

    try {
      await updatePreferencesMutation.mutateAsync({
        preferredProvider,
        preferredModel: preferredModel.trim() || undefined,
        defaultTemperature: parsedTemperature,
        defaultMaxTokens: parsedMaxTokens,
        usageQuota: parsedUsageQuota,
        enableFeedback,
        enableOutcomeTracking,
      });
      toast.success("Preferences saved.");
      await utils.preferences.get.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences.");
    }
  };

  const handleRefreshTrustedData = async () => {
    if (!auth.isAuthenticated) {
      toast.error("Sign in before running a trusted data refresh.");
      return;
    }

    try {
      const result = await refreshSourcesMutation.mutateAsync();
      const ingested = result.results.filter(item => item.status === "ingested").length;
      const skipped = result.results.filter(item => item.status === "skipped").length;
      const failed = result.results.filter(item => item.status === "failed").length;
      toast.success(`Refresh complete. Ingested ${ingested}, skipped ${skipped}, failed ${failed}.`);
      await Promise.all([sourcesQuery.refetch(), eventsQuery.refetch()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Trusted data refresh failed.");
    }
  };

  const handleToggleSource = async (sourceId: string, sourceName: string, enabled: boolean, intervalHours: number) => {
    try {
      await updateSourceConfigMutation.mutateAsync({
        sourceId,
        sourceName,
        enabled,
        intervalHours,
      });
      await sourceConfigsQuery.refetch();
      toast.success("Source schedule updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update source schedule.");
    }
  };

  const handleIntervalChange = async (sourceId: string, sourceName: string, enabled: boolean, intervalHours: number) => {
    await handleToggleSource(sourceId, sourceName, enabled, intervalHours);
  };

  return (
    <div className="space-y-6">
      {!systemStatusQuery.data?.databaseConfigured ? (
        <Card className="border-amber-500/40 bg-amber-500/10 p-5">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">Database Not Configured</h3>
            <p className="text-sm text-slate-300">
              The app can run without a database, but saved keys, preferences, chat memory, trusted-data refresh history, and adjusted ranking signals will not persist until `DATABASE_URL` is set.
            </p>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">
              1. Copy `.env.example` to `.env`
              <br />
              2. Set `DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/africa_market_expansion`
              <br />
              3. Run `corepack pnpm run db:push`
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <KeyRound className="size-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">LLM Providers</h3>
              <p className="text-sm text-slate-400">
                Add the credentials the advisor uses for AI chat, company analysis, and report generation.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
            This section is for model access, not app login. It stores the provider credential the app will use when it calls an LLM on your behalf.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Provider</label>
              <Select value={providerSelection} onValueChange={value => setProviderSelection(value as LlmProviderOption)}>
                <SelectTrigger className="w-full border-slate-600 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmProviders.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Auth mode: {selectedProvider.authLabel}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Key label</label>
              <Input
                value={keyName}
                onChange={event => setKeyName(event.target.value)}
                placeholder="Primary OpenAI Key"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Credential type</label>
              <Select
                value={credentialType}
                onValueChange={value => setCredentialType(value as CredentialType)}
              >
                <SelectTrigger className="w-full border-slate-600 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {credentialOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-300">
                {credentialType === "api-key"
                  ? "API key"
                  : credentialType === "entra-token"
                    ? "Entra bearer token"
                    : "OAuth access token"}
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder={
                  credentialType === "api-key"
                    ? "Paste provider key"
                    : "Paste access token"
                }
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>

            {selectedProvider.backendProvider === "custom" && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-slate-300">Base URL</label>
                <Input
                  value={baseUrl}
                  onChange={event => setBaseUrl(event.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <p className="font-medium text-white">{selectedProvider.label}</p>
            <p className="mt-1 text-sm text-slate-400">{selectedProvider.note}</p>
            {providerSelection === "openai" ? (
              <p className="mt-3 text-sm text-amber-300">
                ChatGPT or Codex subscription login is not available here as a general app-auth flow. For this app, OpenAI access still requires an API key.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleSaveApiKey}
              disabled={addKeyMutation.isPending}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              <Save className="mr-2 size-4" />
              Save API Key
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestApiKey}
              disabled={testKeyMutation.isPending}
            >
              Test Connection
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Saved Keys
            </h4>
            <div className="space-y-3">
              {keysQuery.data?.length ? (
                keysQuery.data.map(key => (
                  <div
                    key={key.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{key.name}</span>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {key.provider}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {key.credentialType.replace("_", " ")}
                        </Badge>
                        {key.isActive ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            Active
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-400">
                        Created {formatDate(key.createdAt)}. Last used {formatDate(key.lastUsed)}.
                      </p>
                      {key.baseUrl ? (
                        <p className="text-xs text-slate-500 break-all">{key.baseUrl}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={deleteKeyMutation.isPending}
                      className="text-slate-300 hover:text-white"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No provider keys saved yet.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bot className="size-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">AI Preferences</h3>
              <p className="text-sm text-slate-400">
                Choose the default provider and generation behavior.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Default provider</label>
              <Select
                value={preferredProvider}
                onValueChange={value => setPreferredProvider(value as LlmProvider)}
              >
                <SelectTrigger className="w-full border-slate-600 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmProviders.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Default model</label>
              <Input
                value={preferredModel}
                onChange={event => setPreferredModel(event.target.value)}
                placeholder="gpt-4.1-mini or claude-3-5-sonnet"
                className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Temperature</label>
                <Input
                  value={temperature}
                  onChange={event => setTemperature(event.target.value)}
                  className="border-slate-600 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Max tokens</label>
                <Input
                  value={maxTokens}
                  onChange={event => setMaxTokens(event.target.value)}
                  className="border-slate-600 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Monthly quota</label>
                <Input
                  value={usageQuota}
                  onChange={event => setUsageQuota(event.target.value)}
                  className="border-slate-600 bg-slate-900 text-white"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">Enable feedback</p>
                  <p className="text-sm text-slate-400">Allow recommendation feedback capture.</p>
                </div>
                <Switch checked={enableFeedback} onCheckedChange={setEnableFeedback} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">Track outcomes</p>
                  <p className="text-sm text-slate-400">Store downstream investment outcome signals.</p>
                </div>
                <Switch checked={enableOutcomeTracking} onCheckedChange={setEnableOutcomeTracking} />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSavePreferences}
              disabled={updatePreferencesMutation.isPending}
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
            >
              <Save className="mr-2 size-4" />
              Save Preferences
            </Button>
          </div>
        </Card>
      </div>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Shield className="size-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Authentication</h3>
              <p className="text-sm text-slate-400">
                Account state, login flow, and delegated auth configuration overview.
              </p>
            </div>
        </div>

        <div className="mb-6 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
          This section is for signing into the app itself and for tracking delegated auth options. The app uses login state to protect saved API keys, preferences, company profiles, and AI history per user.
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Status</span>
              <Badge className={auth.isAuthenticated ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-slate-700 text-white hover:bg-slate-700"}>
                {auth.isAuthenticated ? "Signed in" : "Signed out"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">User</p>
              <p className="font-medium text-white">
                {auth.user?.name || auth.user?.email || auth.user?.openId || "No active session"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Preferred auth provider</label>
              <Select
                value={authProvider}
                onValueChange={value => setAuthProvider(value as AuthProvider)}
              >
                <SelectTrigger className="w-full border-slate-600 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {authProviders.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                The current server callback is wired to the existing OAuth gateway. Google, OpenRouter OAuth, and Microsoft Entra are listed because they are relevant delegated-auth patterns, but they still need backend wiring before they can be used live here.
              </p>
            </div>
            {auth.isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => auth.logout()}
                className="w-full"
              >
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full bg-amber-500 text-black hover:bg-amber-400"
                disabled={!loginUrl}
                onClick={() => {
                  if (!loginUrl) {
                    toast.error("OAuth is not configured yet.");
                    return;
                  }
                  window.location.href = loginUrl;
                }}
              >
                <LogIn className="mr-2 size-4" />
                Start Login Flow
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">OAuth portal URL</p>
              <p className="mt-1 break-all text-sm text-white">
                {oauthPortalUrl || "Not configured"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">App ID</p>
              <p className="mt-1 break-all text-sm text-white">
                {appId || "Not configured"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 md:col-span-2">
              <p className="text-sm text-slate-400">Callback URL</p>
              <p className="mt-1 break-all text-sm text-white">{callbackUrl}</p>
            </div>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 md:col-span-2">
              <p className="font-medium text-white">Backend auth note</p>
              <p className="mt-2 text-sm text-slate-400">
                To fully enable OAuth, the server still needs `OAUTH_SERVER_URL`, and the client needs `VITE_OAUTH_PORTAL_URL` plus `VITE_APP_ID`. This panel surfaces the current state, but those server env values are still the source of truth.
              </p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 md:col-span-2">
              <p className="font-medium text-white">Provider auth guide</p>
              <div className="mt-3 space-y-2 text-sm text-slate-400">
                <p><span className="text-white">OpenAI / Codex:</span> API key authentication.</p>
                <p><span className="text-white">Google Gemini / Vertex AI:</span> OAuth-supported flows and Google ADC.</p>
                <p><span className="text-white">Azure OpenAI:</span> Microsoft Entra ID bearer tokens or API keys.</p>
                <p><span className="text-white">OpenRouter:</span> API keys, with OAuth-capable app flows noted in their docs.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Bot className="size-5 text-amber-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Trusted Data Refresh</h3>
            <p className="text-sm text-slate-400">
              Pull official-source updates for policy, trade, treaty, and macro insight context.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
          This refresh uses the trusted-source catalog, stores fetched source documents, and extracts country-level event signals the advisor can use alongside the numeric rankings.
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleRefreshTrustedData}
            disabled={refreshSourcesMutation.isPending || !auth.isAuthenticated}
            className="bg-amber-500 text-black hover:bg-amber-400"
          >
            {refreshSourcesMutation.isPending ? "Refreshing..." : "Refresh Trusted Data"}
          </Button>
          {!auth.isAuthenticated ? (
            <p className="self-center text-xs text-slate-500">
              Sign in to run or reschedule trusted-data refresh jobs.
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Recent Sources
            </h4>
            <div className="space-y-3">
              {sourcesQuery.data?.length ? (
                sourcesQuery.data.map(source => (
                  <div
                    key={source.id}
                    className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                  >
                    <p className="font-medium text-white">{source.sourceName}</p>
                    <p className="mt-1 text-sm text-slate-400">{source.title}</p>
                    <p className="mt-2 text-xs text-slate-500 break-all">{source.sourceUrl}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No trusted-source documents stored yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Recent Extracted Events
            </h4>
            <div className="space-y-3">
              {eventsQuery.data?.length ? (
                eventsQuery.data.map(event => (
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
                    <p className="mt-2 text-sm text-slate-300">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{event.summary}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No extracted insight events yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Source Schedules
            </h4>
            <div className="space-y-3">
              {sourceConfigsQuery.data?.map(config => (
                <div
                  key={config.sourceId}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{config.sourceName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Last run: {formatDate(config.lastRunAt)} | Next run: {formatDate(config.nextRunAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Status: {config.lastStatus}{config.lastMessage ? ` | ${config.lastMessage}` : ""}
                      </p>
                    </div>
                    <Switch
                      checked={config.enabled}
                      disabled={!auth.isAuthenticated}
                      onCheckedChange={checked =>
                        handleToggleSource(config.sourceId, config.sourceName, checked, config.intervalHours)
                      }
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-slate-400">Interval</span>
                    <Select
                      value={String(config.intervalHours)}
                      disabled={!auth.isAuthenticated}
                      onValueChange={value =>
                        handleIntervalChange(
                          config.sourceId,
                          config.sourceName,
                          config.enabled,
                          Number(value)
                        )
                      }
                    >
                      <SelectTrigger className="w-40 border-slate-600 bg-slate-900 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">Every 6 hours</SelectItem>
                        <SelectItem value="12">Every 12 hours</SelectItem>
                        <SelectItem value="24">Every 24 hours</SelectItem>
                        <SelectItem value="72">Every 3 days</SelectItem>
                        <SelectItem value="168">Every 7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )) || (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No source schedule configs yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Adjusted Ranking Signals
            </h4>
            <div className="space-y-3">
              {adjustedRankingsQuery.data?.length ? (
                adjustedRankingsQuery.data.map(item => (
                  <div
                    key={item.country}
                    className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.country}</p>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {item.region}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Base {item.baseScore} {"->"} Adjusted {item.adjustedScore} ({item.adjustment >= 0 ? "+" : ""}{item.adjustment})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Event count: {item.eventCount}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  No ranking adjustments computed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
