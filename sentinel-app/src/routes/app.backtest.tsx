import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Play, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { listStrategies } from "@/lib/strategy-engine";
import { runBacktest, type BacktestResult } from "@/lib/backtest-engine";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

export const Route = createFileRoute("/app/backtest")({
  component: BacktestPage,
});

function BacktestPage() {
  const { snapshot } = useMarketSnapshot();
  const strategies = listStrategies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const run = () => {
    if (!selectedId || !snapshot) return;
    const strategy = strategies.find((s) => s.id === selectedId);
    if (!strategy) return;
    setResult(runBacktest(strategy, snapshot as any));
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-1">
        <BarChart3 className="h-3.5 w-3.5" /> Backtesting Engine
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Strategy Backtest</h1>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        Test your trading strategies against historical market data.
      </p>

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Select Strategy
            </label>
            <select
              value={selectedId ?? ""}
              onChange={(e) => {
                setSelectedId(e.target.value || null);
                setResult(null);
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value="">-- Choose a strategy --</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={run}
            disabled={!selectedId || !snapshot}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
          >
            <Play className="h-4 w-4" /> Run Backtest
          </button>
        </div>
        {strategies.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            No strategies available. Create one in the Copilot tab first.
          </p>
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Days Analyzed
              </div>
              <div className="mt-1 font-display text-2xl font-bold">{result.totalDays}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Trigger Days
              </div>
              <div className="mt-1 font-display text-2xl font-bold">{result.triggerDays}</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Trigger Rate
              </div>
              <div
                className={`mt-1 font-display text-2xl font-bold ${result.triggerRate >= 50 ? "ticker-up" : "ticker-down"}`}
              >
                {result.triggerRate}%
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <h3 className="font-display font-semibold mb-3">
              7-Day Backtest: {result.strategyName}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.days}>
                  <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Price"]}
                  />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                    {result.days.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.triggered ? "#22c55e" : "#64748b"}
                        fillOpacity={d.triggered ? 0.8 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-display font-semibold">Daily Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-2 font-medium">Day</th>
                  <th className="text-right px-5 py-2 font-medium">Price</th>
                  <th className="text-right px-5 py-2 font-medium">Change</th>
                  <th className="text-center px-5 py-2 font-medium">Triggered</th>
                </tr>
              </thead>
              <tbody>
                {result.days.map((d, i) => (
                  <tr key={i} className="border-t border-border/60 hover:bg-surface/30">
                    <td className="px-5 py-3 font-medium">{d.day}</td>
                    <td className="px-5 py-3 text-right font-mono">${d.price.toLocaleString()}</td>
                    <td
                      className={`px-5 py-3 text-right font-mono ${d.change24h >= 0 ? "ticker-up" : "ticker-down"}`}
                    >
                      {d.change24h >= 0 ? "+" : ""}
                      {d.change24h}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      {d.triggered ? (
                        <CheckCircle2 className="h-4 w-4 inline text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 inline text-muted-foreground/40" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!result && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Select a strategy and run a backtest</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Analyzes the last 7 days against your strategy rules.
          </p>
        </div>
      )}
    </div>
  );
}
