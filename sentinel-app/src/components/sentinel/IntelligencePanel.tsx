import { useEffect, useState } from "react";
import { ShieldAlert, TrendingUp, Brain, Activity } from "lucide-react";
import { type MarketSnapshot } from "@/lib/intelligence-engine";

const fallbackSnapshot: Pick<
  MarketSnapshot,
  "risk" | "alerts" | "tickers" | "reasoning" | "sourceStack"
> = {
  risk: {
    score: 64,
    level: "HIGH",
    reasons: [
      "ETF stress is still elevated.",
      "Macro volatility is approaching a scheduled catalyst.",
      "Liquidity is rotating, not expanding universally.",
    ],
  },
  alerts: [
    {
      id: "fallback-etf",
      title: "BTC ETF outflows are still elevated",
      severity: "HIGH",
      body: "ETF outflows rising above the normal band typically precede short-term downside pressure.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fallback-macro",
      title: "Macro event window open",
      severity: "HIGH",
      body: "Expect wider spreads and lower conviction until the event risk clears.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fallback-rotation",
      title: "Rotation detected in AI / Solana baskets",
      severity: "MEDIUM",
      body: "Select names are attracting flows even while the broader tape stays defensive.",
      createdAt: new Date().toISOString(),
    },
  ],
  tickers: [
    { symbol: "FET", price: 1.42, change: 8.2 },
    { symbol: "SOL", price: 218.6, change: 4.6 },
    { symbol: "ETH", price: 3284, change: 2.1 },
    { symbol: "ARB", price: 0.78, change: -3.4 },
  ],
  reasoning: {
    summary: "BTC ETF outflows are weakening institutional risk appetite.",
    reasoning:
      "ETF outflows rising above the normal band typically precede short-term downside pressure in majors.",
    riskLevel: "HIGH",
    suggestedAction:
      "Trim marginal risk, keep hedges active, and prefer high-conviction rotations only.",
    confidence: 84,
  },
  sourceStack: [
    { name: "CoinGecko", role: "primary", note: "Static pricing fallback" },
    { name: "DefiLlama", role: "supplemental", note: "Static liquidity fallback" },
    { name: "Sentinel", role: "supplemental", note: "Multi-factor heuristic analysis" },
  ],
};

export function IntelligencePanel() {
  const [snapshot, setSnapshot] =
    useState<Pick<MarketSnapshot, "risk" | "alerts" | "tickers" | "reasoning" | "sourceStack">>(
      fallbackSnapshot,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const response = await fetch("/app/api/market");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as MarketSnapshot;
        if (cancelled) return;
        setSnapshot({
          risk: data.risk,
          alerts: data.alerts,
          tickers: data.tickers,
          reasoning: data.reasoning,
          sourceStack: data.sourceStack,
        });
      } catch {
        // keep fallback snapshot
      }
    }

    loadSnapshot();
    const interval = setInterval(loadSnapshot, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const topMovers = snapshot.tickers.slice(0, 4);
  const activeAlerts = snapshot.alerts.slice(0, 3);

  return (
    <aside className="hidden xl:flex w-80 shrink-0 flex-col border-l border-border bg-surface/30 backdrop-blur-md">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Risk Pulse
          </h3>
          <ShieldAlert className="h-4 w-4 text-warning" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-warning">
            {snapshot.risk.score}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success via-warning to-destructive"
            style={{ width: `${snapshot.risk.score}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{snapshot.reasoning.suggestedAction}</p>
      </div>

      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Active Warnings
          </h3>
        </div>
        <ul className="space-y-3">
          {activeAlerts.map((w) => (
            <li key={w.id} className="rounded-md border border-border/60 bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{w.title}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{w.severity}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{w.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-success" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Top Movers
          </h3>
        </div>
        <ul className="space-y-2">
          {topMovers.map((m) => (
            <li key={m.symbol} className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{m.symbol}</span>
              <span className="font-mono text-muted-foreground">${m.price}</span>
              <span className={`font-mono ${m.change >= 0 ? "ticker-up" : "ticker-down"}`}>
                {m.change >= 0 ? "+" : ""}
                {m.change}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Data Sources
          </span>
        </div>
        <ul className="space-y-1">
          {snapshot.sourceStack.map((s) => {
            const isLive = s.note.toLowerCase().includes("live");
            return (
              <li key={s.name} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{s.name}</span>
                <span className={`font-mono ${isLive ? "text-success" : "text-warning"}`}>
                  {isLive ? "● Live" : "● Fallback"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
