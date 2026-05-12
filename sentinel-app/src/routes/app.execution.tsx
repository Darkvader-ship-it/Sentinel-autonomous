import { createFileRoute } from "@tanstack/react-router";
import { Zap, ArrowRight } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";

export const Route = createFileRoute("/app/execution")({
  component: ExecutionPage,
});

function ExecutionPage() {
  const { snapshot } = useMarketSnapshot();
  const executions = snapshot?.executions ?? [];

  const displayExecutions = executions.length
    ? executions
    : [
        {
          from: "USDC",
          to: "ETH",
          sizeUsd: 8200,
          route: "SoDEX · 3 hops",
          status: "filled" as const,
          createdAt: "12m ago",
          slippageBps: 8,
          estimatedFeesUsd: 5.06,
        },
        {
          from: "BTC",
          to: "USDC",
          sizeUsd: 5600,
          route: "SoDEX · direct",
          status: "filled" as const,
          createdAt: "44m ago",
          slippageBps: 6,
          estimatedFeesUsd: 3.63,
        },
        {
          from: "USDC",
          to: "FET",
          sizeUsd: 2400,
          route: "SoDEX · 2 hops",
          status: "pending" as const,
          createdAt: "now",
          slippageBps: 11,
          estimatedFeesUsd: 2.07,
        },
      ];

  const filledCount = displayExecutions.filter(e => e.status === "filled").length;
  const totalVolume = displayExecutions
    .filter(e => e.status === "filled")
    .reduce((s, e) => s + e.sizeUsd, 0);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Execution</h1>
        <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/50 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {filledCount} filled · ${totalVolume.toLocaleString()} volume
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Pending and recently executed strategies through SoDEX.
      </p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {displayExecutions.map((t, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 px-5 py-4 border-t first:border-t-0 border-border/60 hover:bg-surface/20 transition"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-md p-2 ${t.status === "filled" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {t.from} <ArrowRight className="h-3 w-3 inline text-muted-foreground" /> {t.to}
                </div>
                <div className="text-xs text-muted-foreground">{t.route}</div>
                {'slippageBps' in t && (
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Slippage {t.slippageBps} bps · Fee ${'estimatedFeesUsd' in t ? (t as any).estimatedFeesUsd.toFixed(2) : "—"}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">${t.sizeUsd.toLocaleString()}</div>
              <div
                className={`font-mono text-[10px] ${t.status === "filled" ? "ticker-up" : "text-warning"}`}
              >
                {t.status === "filled" ? "Filled" : "Routing"} · {t.createdAt}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!executions.length && (
        <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs text-primary/80">
            Click <strong>Execute</strong> on any signal card to see your trades appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
}
