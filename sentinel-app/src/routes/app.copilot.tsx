import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Brain,
  Send,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Bot,
  Zap,
} from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import {
  evaluateStrategy,
  parseNaturalLanguage,
  listStrategies,
  addStrategy,
  removeStrategy,
  toggleStrategy,
  type Strategy,
} from "@/lib/strategy-engine";

export const Route = createFileRoute("/app/copilot")({
  component: CopilotPage,
});

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function CopilotPage() {
  const { snapshot } = useMarketSnapshot();
  const [input, setInput] = useState("");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "I'm Sentinel Copilot. Tell me a trading strategy in plain English and I'll watch the markets for it.\n\nExample: \"alert me when ETH/BTC ratio crosses 0.05 with volume > $1B\"",
    },
  ]);
  const [activeTab, setActiveTab] = useState<"chat" | "strategies">("chat");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStrategies(listStrategies());
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text) return;
    setChat((prev) => [...prev, { role: "user", text }]);
    setInput("");

    const parsed = parseNaturalLanguage(text, snapshot?.tickers?.[0]?.symbol ?? "BTC");
    const ruleSummary = parsed.condition.rules
      .map(
        (r) =>
          `${r.field}${r.symbol ? " " + r.symbol : ""}${r.pair ? " " + r.pair : ""} ${r.operator} ${r.value}`,
      )
      .join(` ${parsed.condition.logic} `);

    const strategy = addStrategy(text);
    setStrategies(listStrategies());

    const triggered = snapshot
      ? evaluateStrategy(strategy, snapshot as any, snapshot.signals ?? [])
      : false;

    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Created strategy "${strategy.name}".\n\n**Rules:** ${ruleSummary}\n**Action:** ${strategy.action.type}\n\n${triggered ? "⚡ This strategy would trigger RIGHT NOW based on current market data." : "📡 Watching markets — I'll notify you when conditions are met."}\n\nYou can view and manage all strategies in the Strategies tab.`,
        },
      ]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeCount = strategies.filter((s) => s.enabled).length;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-1">
            <Bot className="h-3.5 w-3.5" /> AI Trading Copilot
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Strategy Builder</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/50 px-3 py-1.5">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {activeCount} active strategy{activeCount !== 1 ? "ies" : "y"}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Describe what you want to watch in plain English. Sentinel parses it into rules and
        evaluates them against live market data.
      </p>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            activeTab === "chat"
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Chat
        </button>
        <button
          onClick={() => setActiveTab("strategies")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            activeTab === "strategies"
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Zap className="h-3.5 w-3.5" /> Strategies ({strategies.length})
        </button>
      </div>

      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface border border-border text-foreground"
                  }`}
                >
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. alert me when SOL breaks above $200..."
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 transition"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border bg-card overflow-y-auto">
          {strategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Brain className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No strategies yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Describe your first strategy in the Chat tab.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {strategies.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-4 hover:bg-surface/20 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                          s.enabled
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-muted/10 text-muted-foreground border border-border"
                        }`}
                      >
                        {s.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.condition.rules.map((r, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-primary/5 border border-primary/20 px-2 py-0.5 text-[9px] font-mono text-primary"
                        >
                          {r.field}
                          {r.symbol ? " " + r.symbol : ""}
                          {r.pair ? " " + r.pair : ""} {r.operator} {r.value}
                        </span>
                      ))}
                      <span className="rounded-full bg-surface border border-border px-2 py-0.5 text-[9px] font-mono text-muted-foreground">
                        {s.action.type}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1.5 font-mono">
                      Created {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        toggleStrategy(s.id);
                        setStrategies(listStrategies());
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                      title={s.enabled ? "Pause" : "Activate"}
                    >
                      {s.enabled ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        removeStrategy(s.id);
                        setStrategies(listStrategies());
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
