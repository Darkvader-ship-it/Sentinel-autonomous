import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import type { RiskProfile } from "@/lib/intelligence-engine";
import type { StructuredSignal } from "@/lib/sentinel-types";
import { motion } from "framer-motion";
import { Zap, Radio } from "lucide-react";
import { ExecutionModal, type ExecutionPlan } from "@/components/sentinel/ExecutionModal";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";

export const Route = createFileRoute("/app/signals")({
  component: SignalsPage,
});

const severityColor: Record<string, string> = {
  LOW: "text-success border-success/40 bg-success/10",
  MEDIUM: "text-warning border-warning/40 bg-warning/10",
  HIGH: "text-destructive border-destructive/40 bg-destructive/10",
  CRITICAL: "text-destructive border-destructive/60 bg-destructive/20",
};

function SignalsPage() {
  const { snapshot, loading } = useMarketSnapshot();
  const signals: StructuredSignal[] = snapshot?.signals ?? [];
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const selectedSignal = signals.find((signal) => signal.id === selectedSignalId) ?? null;
  const executionPlan = useMemo<ExecutionPlan | null>(() => {
    if (!selectedSignal) return null;
    return buildPlanFromSignal(selectedSignal);
  }, [selectedSignal]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-1">
        <Radio className="h-3.5 w-3.5" /> Signals
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Opportunities</h1>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        High-conviction setups with reasoning, risk, and one-click execution.
      </p>

      {loading && signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative flex h-12 w-12 items-center justify-center mb-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Scanning for opportunities…</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {signals.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {s.type}
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${severityColor[s.severity]}`}
                >
                  {s.severity}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.summary}</h3>
              <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{s.explanation}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border/60 bg-surface/50 p-2.5">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">
                    Suggested Trade
                  </div>
                  <div className="mt-1 text-xs text-foreground">{suggestTrade(s)}</div>
                </div>
                <div className="rounded-md border border-border/60 bg-surface/50 p-2.5">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">
                    Upside
                  </div>
                  <div className="mt-1 text-xs font-mono text-success">{suggestUpside(s)}</div>
                </div>
              </div>

              {s.context.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.context.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface/50 border border-border/40 px-2 py-0.5 text-[9px] font-mono text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedSignalId(s.id)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition glow-primary"
              >
                <Zap className="h-3.5 w-3.5" /> Execute
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <ExecutionModal
        open={selectedSignal !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSignalId(null);
        }}
        plan={executionPlan}
      />
    </div>
  );
}

function suggestTrade(signal: StructuredSignal): string {
  const t = signal.summary.toLowerCase();
  if (t.includes("etf") || t.includes("btc")) return "USDC → BTC";
  if (t.includes("solana") || t.includes("rotation")) return "USDC → SOL";
  if (t.includes("ai") || t.includes("fetch")) return "USDC → FET";
  if (t.includes("eth") || t.includes("ethereum")) return "ETH → USDC";
  if (t.includes("unlock") || t.includes("supply")) return "ARB → USDC";
  if (t.includes("macro") || t.includes("volatility")) return "USDC → USDT";
  return "USDC → ETH";
}

function suggestUpside(signal: StructuredSignal): string {
  if (signal.severity === "HIGH") return signal.confidence >= 80 ? "+12-18%" : "+6-10%";
  if (signal.severity === "MEDIUM") return signal.confidence >= 80 ? "+8-14%" : "+4-8%";
  return "+2-5%";
}

function buildPlanFromSignal(signal: StructuredSignal): ExecutionPlan {
  const title = signal.summary.toLowerCase();
  const trade = suggestTrade(signal);

  if (title.includes("solana") || title.includes("rotation")) {
    return {
      from: "USDC",
      to: "SOL",
      sizeUsd: 6_400,
      route: "SoDEX · 2 hops",
      reason: trade,
      riskProfile: "Moderate",
    };
  }

  if (title.includes("etf") || title.includes("btc")) {
    return {
      from: "USDC",
      to: "BTC",
      sizeUsd: 8_200,
      route: "SoDEX · direct",
      reason: trade,
      riskProfile: "Moderate",
    };
  }

  if (title.includes("unlock") || title.includes("supply")) {
    return {
      from: "ARB",
      to: "USDC",
      sizeUsd: 5_200,
      route: "SoDEX · direct",
      reason: trade,
      riskProfile: "Conservative",
    };
  }

  if (title.includes("ai") || title.includes("fetch")) {
    return {
      from: "USDC",
      to: "FET",
      sizeUsd: 4_800,
      route: "SoDEX · 2 hops",
      reason: trade,
      riskProfile: "Aggressive",
    };
  }

  return {
    from: "USDC",
    to: "ETH",
    sizeUsd: signal.severity === "HIGH" ? 8_200 : 4_600,
    route: "SoDEX · direct",
    reason: trade,
    riskProfile: signal.severity === "HIGH" ? "Moderate" : "Aggressive",
  };
}
