import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";

export const Route = createFileRoute("/app/execution")({
  component: ExecutionPage,
});

function ExecutionPage() {
  const { snapshot } = useMarketSnapshot();
  const executions = snapshot?.executions ?? [];

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">Execution</h1>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        Pending and recently executed strategies through SoDEX.
      </p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {(executions.length
          ? executions
          : [
              {
                from: "USDC",
                to: "ETH",
                sizeUsd: 8200,
                route: "SoDEX · 3 hops",
                status: "filled",
                createdAt: "12m ago",
              },
              {
                from: "BTC",
                to: "USDC",
                sizeUsd: 5600,
                route: "SoDEX · direct",
                status: "filled",
                createdAt: "44m ago",
              },
              {
                from: "USDC",
                to: "FET",
                sizeUsd: 2400,
                route: "SoDEX · 2 hops",
                status: "pending",
                createdAt: "now",
              },
            ]
        ).map((t, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 px-5 py-4 border-t first:border-t-0 border-border/60"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {t.from} <span className="text-muted-foreground">→</span> {t.to}
                </div>
                <div className="text-xs text-muted-foreground">{t.route}</div>
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
    </div>
  );
}
