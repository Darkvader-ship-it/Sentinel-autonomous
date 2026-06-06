import { createFileRoute } from "@tanstack/react-router";
import { Zap, ArrowRight } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import type { ExecutionRecord } from "@/lib/sentinel-types";

export const Route = createFileRoute("/app/execution")({
  component: ExecutionPage,
});

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ExecutionPage() {
  const { snapshot } = useMarketSnapshot();
  const executions: ExecutionRecord[] = snapshot?.executions ?? [];

  const filledCount = executions.filter((e) => e.status === "filled").length;
  const totalVolume = executions
    .filter((e) => e.status === "filled")
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
        Pending and recently executed strategies.
      </p>

      {executions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Zap className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No executions yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click <strong>Execute</strong> on any signal card to submit your first trade.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {executions.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-4 px-5 py-4 border-t first:border-t-0 border-border/60 hover:bg-surface/20 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-md p-2 ${t.status === "filled" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}
                >
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {t.from} <ArrowRight className="h-3 w-3 inline text-muted-foreground" /> {t.to}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.route}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Slippage {t.slippageBps} bps · Fee ${t.estimatedFeesUsd.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">${t.sizeUsd.toLocaleString()}</div>
                <div
                  className={`font-mono text-[10px] ${t.status === "filled" ? "ticker-up" : "text-warning"}`}
                >
                  {t.status === "filled" ? "Filled" : "Routing"} · {formatTime(t.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
