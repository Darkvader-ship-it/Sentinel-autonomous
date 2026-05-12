import { createFileRoute } from "@tanstack/react-router";
import {
  portfolio as fallbackPortfolio,
  portfolioHistory as fallbackHistory,
} from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Brain, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { useAuth } from "@/lib/auth";
import { useWalletPortfolio } from "@/hooks/use-wallet-portfolio";

export const Route = createFileRoute("/app/portfolio")({
  component: PortfolioPage,
});

const SECTOR_COLORS = ["#5eead4", "#67e8f9", "#a5f3fc", "#facc15", "#94a3b8"];

function PortfolioPage() {
  const { user } = useAuth();
  const { snapshot } = useMarketSnapshot();

  const prices = useMemo(() => {
    if (!snapshot?.tickers) return {};
    const map: Record<string, number> = {};
    for (const t of snapshot.tickers) {
      map[t.symbol] = t.price;
      map[t.symbol + "_24h"] = t.change;
    }
    return map;
  }, [snapshot?.tickers]);

  const { portfolio: walletPortfolio, loading: walletLoading } = useWalletPortfolio(
    user?.wallet,
    prices,
  );

  const portfolio = walletPortfolio ?? snapshot?.portfolio ?? fallbackPortfolio;
  const portfolioHistory = snapshot?.portfolioHistory ?? fallbackHistory;
  const up24 = portfolio.pnl24h >= 0;
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
        <div
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] uppercase tracking-wider ${walletPortfolio ? "border-success/30 bg-success/5 text-success" : "border-warning/30 bg-warning/5 text-warning"}`}
        >
          <Wallet className="h-3 w-3" />
          {walletLoading ? "Loading…" : walletPortfolio ? "Live Wallet" : "Demo Data"}
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        Holdings, exposure, and Sentinel's read on your risk.
      </p>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total Value" value={`$${portfolio.totalValue.toLocaleString()}`} />
        <Stat
          label="24h PnL"
          value={`${up24 ? "+" : ""}$${Math.abs(portfolio.pnl24h).toLocaleString()}`}
          sub={`${up24 ? "+" : ""}${portfolio.pnl24hPct}%`}
          tone={up24 ? "up" : "down"}
        />
        <Stat
          label="7d PnL"
          value={`${portfolio.pnl7d >= 0 ? "+" : ""}$${Math.abs(portfolio.pnl7d).toLocaleString()}`}
          sub={`${portfolio.pnl7dPct}%`}
          tone={portfolio.pnl7d >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Equity Curve · 7d</h3>
            <span className="font-mono text-[10px] text-muted-foreground">USD</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5eead4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 2000", "dataMax + 2000"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#5eead4"
                  strokeWidth={2}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold mb-3">Sector Exposure</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolio.exposure}
                  dataKey="value"
                  nameKey="sector"
                  innerRadius={36}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {portfolio.exposure.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {portfolio.exposure.map((s, i) => (
              <li key={s.sector} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                  />
                  {s.sector}
                </span>
                <span className="font-mono">{s.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-2">
          <Brain className="h-3.5 w-3.5" /> Portfolio Analysis
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {buildPortfolioAnalysis(portfolio, snapshot?.risk.score ?? 50)}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-display font-semibold">Holdings</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-right px-5 py-2 font-medium">Balance</th>
              <th className="text-right px-5 py-2 font-medium">Value</th>
              <th className="text-right px-5 py-2 font-medium">Allocation</th>
              <th className="text-right px-5 py-2 font-medium">24h</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.holdings.map((h) => (
              <tr key={h.symbol} className="border-t border-border/60 hover:bg-surface/30">
                <td className="px-5 py-3">
                  <div className="font-medium">{h.symbol}</div>
                  <div className="text-xs text-muted-foreground">{h.name}</div>
                </td>
                <td className="px-5 py-3 text-right font-mono text-muted-foreground text-xs">
                  {h.balance}
                </td>
                <td className="px-5 py-3 text-right font-mono">${h.value.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                  {h.allocation}%
                </td>
                <td
                  className={`px-5 py-3 text-right font-mono ${h.change >= 0 ? "ticker-up" : "ticker-down"}`}
                >
                  {h.change >= 0 ? "+" : ""}
                  {h.change}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildPortfolioAnalysis(
  pf: { holdings: Array<{ symbol: string; allocation: number; value: number; change: number }> },
  riskScore: number,
): string {
  const stablesPct = pf.holdings
    .filter((h) => ["USDC", "USDT", "DAI"].includes(h.symbol))
    .reduce((s, h) => s + h.allocation, 0);
  const majorsPct = pf.holdings
    .filter((h) => ["BTC", "ETH"].includes(h.symbol))
    .reduce((s, h) => s + h.allocation, 0);
  const best = pf.holdings.reduce((a, b) => (a.value > b.value ? a : b));
  const worst = pf.holdings.reduce((a, b) => (a.change < b.change ? a : b));
  const stableAdvice =
    stablesPct < 10
      ? `Stablecoin allocation is low at ${stablesPct.toFixed(1)}%. Consider increasing by 3-5% as a buffer.`
      : stablesPct > 25
        ? `Stablecoin allocation at ${stablesPct.toFixed(1)}% — adequate dry powder for drawdown buying.`
        : `Stablecoin allocation at ${stablesPct.toFixed(1)}% — within a reasonable range.`;
  const concAdvice =
    majorsPct < 30
      ? `Portfolio is diversified away from majors (${majorsPct.toFixed(1)}% BTC/ETH). Monitor alt-LP correlation risk.`
      : majorsPct > 80
        ? `Heavily weighted in majors (${majorsPct.toFixed(1)}%). Low correlation risk but concentrated in two assets.`
        : `Balanced exposure to majors at ${majorsPct.toFixed(1)}%.`;
  const riskAdvice =
    riskScore >= 70
      ? `Risk score is elevated (${riskScore}/100). Prioritize capital preservation — tighten stops.`
      : riskScore >= 45
        ? `Risk score at ${riskScore}/100 — moderate. Selective positioning acceptable.`
        : `Risk score at ${riskScore}/100 — low stress environment favors quality setups.`;
  return `${best.symbol} is the dominant position (${best.allocation.toFixed(1)}% allocation, ${best.change >= 0 ? "+" : ""}${best.change}% 24h). ${worst.symbol} is the weakest mover at ${worst.change}%. ${concAdvice} ${stableAdvice} ${riskAdvice}`;
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
}) {
  const Icon = tone === "up" ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {sub && (
        <div
          className={`mt-1 flex items-center gap-1 text-xs font-mono ${tone === "up" ? "ticker-up" : "ticker-down"}`}
        >
          {tone && <Icon className="h-3 w-3" />} {sub}
        </div>
      )}
    </div>
  );
}
