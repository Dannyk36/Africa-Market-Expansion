import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Download, Paperclip, Save, Trash2, Upload } from "lucide-react";

type UploadedFile = {
  id: string;
  name: string;
  type: "website" | "document" | "image";
  content?: string;
};

type CompanyWorkspace = {
  companyName: string;
  industry: string;
  businessModel: string;
  targetMarkets: string;
  currentPresence: string;
  strategicNotes: string;
};

type ResponseEvidence = {
  topMarkets?: Array<{ name: string; region: string; score: number }>;
  recentEvents?: Array<{ country: string; eventType: string; title: string; impactDirection: string }>;
  attachmentsUsed?: Array<{ name: string; type: string }>;
};

const starterMessage =
  "I can help analyze a company, suggest expansion markets, and sketch an entry strategy. Add a website or document for context, or ask a direct question.";

const WORKSPACE_STORAGE_KEY = "africa-market-workspace-v1";

export default function AIChat() {
  const historyQuery = trpc.advisor.history.useQuery({ limit: 8 });
  const advisorMutation = trpc.advisor.query.useMutation();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: starterMessage },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [lastEvidence, setLastEvidence] = useState<ResponseEvidence | null>(null);
  const [workspace, setWorkspace] = useState<CompanyWorkspace>(() => {
    if (typeof window === "undefined") {
      return {
        companyName: "",
        industry: "",
        businessModel: "",
        targetMarkets: "",
        currentPresence: "",
        strategicNotes: "",
      };
    }

    const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!stored) {
      return {
        companyName: "",
        industry: "",
        businessModel: "",
        targetMarkets: "",
        currentPresence: "",
        strategicNotes: "",
      };
    }

    try {
      return JSON.parse(stored) as CompanyWorkspace;
    } catch {
      return {
        companyName: "",
        industry: "",
        businessModel: "",
        targetMarkets: "",
        currentPresence: "",
        strategicNotes: "",
      };
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    if (historyLoaded) return;
    if (historyQuery.isLoading) return;
    if (!historyQuery.data?.length) {
      setHistoryLoaded(true);
      return;
    }

    const hydratedMessages: Message[] = [{ role: "assistant", content: starterMessage }];
    historyQuery.data
      .slice()
      .reverse()
      .forEach(item => {
        hydratedMessages.push({ role: "user", content: item.query });
        hydratedMessages.push({ role: "assistant", content: item.response });
      });
    setMessages(hydratedMessages);
    setHistoryLoaded(true);
  }, [historyLoaded, historyQuery.data, historyQuery.isLoading]);

  const handleSendMessage = async (content: string) => {
    const pendingFiles = uploadedFiles.map((file) => `- ${file.type}: ${file.name}`);
    const userContent =
      pendingFiles.length > 0
        ? `${content}\n\nAttached context:\n${pendingFiles.join("\n")}`
        : content;

    setMessages(prev => [...prev, { role: "user", content: userContent }]);
    try {
      const response = await advisorMutation.mutateAsync({
        question: content,
        messages: [...messages, { role: "user", content: userContent }],
        attachments: uploadedFiles,
        companyContext: {
          companyName: workspace.companyName || undefined,
          industry: workspace.industry || undefined,
          businessModel: workspace.businessModel || undefined,
          targetMarkets: workspace.targetMarkets
            .split(",")
            .map(item => item.trim())
            .filter(Boolean),
          currentPresence: workspace.currentPresence
            .split(",")
            .map(item => item.trim())
            .filter(Boolean),
          strategicNotes: workspace.strategicNotes || undefined,
        },
      });

      setMessages(prev => [...prev, { role: "assistant", content: response.response }]);
      setLastEvidence(response.evidence ?? null);
      setUploadedFiles([]);
      await historyQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Advisor request failed.");
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't complete that request. Check your provider settings or server configuration, then try again.",
        },
      ]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files) return;

    const nextFiles = await Promise.all(
      Array.from(files).map(async (file, index) => {
        let content: string | undefined;
        const lowerName = file.name.toLowerCase();
        const isTextLike =
          file.type.startsWith("text/") ||
          lowerName.endsWith(".txt") ||
          lowerName.endsWith(".md") ||
          lowerName.endsWith(".csv") ||
          lowerName.endsWith(".json");

        if (isTextLike) {
          try {
            content = (await file.text()).slice(0, 12000);
          } catch {
            content = undefined;
          }
        }

        return {
          id: `${Date.now()}-${index}`,
          name: file.name,
          type: file.type.startsWith("image/") ? ("image" as const) : ("document" as const),
          content,
        };
      })
    );

    setUploadedFiles(prev => [...prev, ...nextFiles]);
    event.currentTarget.value = "";
  };

  const addWebsite = () => {
    const trimmed = websiteUrl.trim();
    if (!trimmed) return;

    setUploadedFiles(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: trimmed,
        type: "website",
        content: trimmed,
      },
    ]);
    setWebsiteUrl("");
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const downloadReport = () => {
    const transcript = messages
      .map(message => `${message.role.toUpperCase()}\n${message.content}`)
      .join("\n\n");

    const report = [
      "AFRICA MARKET EXPANSION REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      transcript,
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(report)}`
    );
    element.setAttribute("download", "africa-market-expansion-report.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const updateWorkspace = (field: keyof CompanyWorkspace, value: string) => {
    setWorkspace(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearWorkspace = () => {
    setWorkspace({
      companyName: "",
      industry: "",
      businessModel: "",
      targetMarkets: "",
      currentPresence: "",
      strategicNotes: "",
    });
  };

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="border-slate-700 bg-slate-900/70 text-slate-100">
        <div className="border-b border-slate-700 p-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="size-5 text-amber-400" />
            <span>AI Advisor</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Add context for company analysis, then ask about target countries, risks, or entry strategy.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Save className="size-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-200">Company workspace</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearWorkspace} className="text-slate-400 hover:text-white">
                Clear
              </Button>
            </div>

            <Input
              value={workspace.companyName}
              onChange={event => updateWorkspace("companyName", event.target.value)}
              placeholder="Company name"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <Input
              value={workspace.industry}
              onChange={event => updateWorkspace("industry", event.target.value)}
              placeholder="Industry"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <Input
              value={workspace.businessModel}
              onChange={event => updateWorkspace("businessModel", event.target.value)}
              placeholder="Business model"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <Input
              value={workspace.targetMarkets}
              onChange={event => updateWorkspace("targetMarkets", event.target.value)}
              placeholder="Target markets, comma separated"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <Input
              value={workspace.currentPresence}
              onChange={event => updateWorkspace("currentPresence", event.target.value)}
              placeholder="Current presence, comma separated"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <Textarea
              value={workspace.strategicNotes}
              onChange={event => updateWorkspace("strategicNotes", event.target.value)}
              placeholder="Strategic notes, goals, constraints, pricing, or risks"
              className="min-h-24 border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Website URL</label>
            <div className="flex gap-2">
              <Input
                value={websiteUrl}
                onChange={event => setWebsiteUrl(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addWebsite();
                  }
                }}
                placeholder="https://company.com"
                className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              <Button type="button" variant="outline" onClick={addWebsite}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Company files</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-600 bg-slate-800/60 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-amber-400 hover:text-white">
              <Upload className="size-4" />
              <span>Upload documents or images</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Attached context</span>
              {uploadedFiles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFiles([])}
                  className="text-slate-400 hover:text-white"
                >
                  <Trash2 className="mr-2 size-4" />
                  Clear
                </Button>
              )}
            </div>

            <ScrollArea className="h-56 rounded-md border border-slate-700 bg-slate-800/40">
              <div className="space-y-2 p-3">
                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-slate-500">No files or links attached yet.</p>
                ) : (
                  uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Paperclip className="size-4 shrink-0 text-amber-400" />
                        <span className="truncate text-slate-200">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="size-8 text-slate-400 hover:text-white"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={downloadReport}>
            <Download className="mr-2 size-4" />
            Download Report
          </Button>

          {lastEvidence ? (
            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <div>
                <p className="text-sm font-medium text-slate-200">Last answer evidence</p>
                <p className="mt-1 text-xs text-slate-500">
                  This shows the context the advisor used most recently.
                </p>
              </div>

              {lastEvidence.topMarkets?.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Top market context</p>
                  <div className="flex flex-wrap gap-2">
                    {lastEvidence.topMarkets.map(item => (
                      <Badge key={item.name} variant="outline" className="border-slate-600 text-slate-300">
                        {item.name} {item.score.toFixed(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {lastEvidence.recentEvents?.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Recent events</p>
                  <div className="space-y-2">
                    {lastEvidence.recentEvents.map(item => (
                      <div key={`${item.country}-${item.title}`} className="rounded-md border border-slate-700 bg-slate-800/50 p-3">
                        <p className="text-sm text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.country} | {item.eventType} | {item.impactDirection}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {lastEvidence.attachmentsUsed?.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Attachments used</p>
                  <div className="flex flex-wrap gap-2">
                    {lastEvidence.attachmentsUsed.map(item => (
                      <Badge key={`${item.type}-${item.name}`} variant="outline" className="border-slate-600 text-slate-300">
                        {item.type}: {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <AIChatBox
        className="border-slate-700 bg-slate-900/70"
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={advisorMutation.isPending}
        height="100%"
        placeholder="Ask which markets fit your company, or what risks to evaluate next..."
        emptyStateMessage="Start the advisor conversation"
        suggestedPrompts={[
          "Which three African markets should a SaaS startup evaluate first?",
          "What should I validate before entering East Africa?",
          "Summarize the expansion risks I should plan around.",
        ]}
      />
    </div>
  );
}
