import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { signals, type RiskLevel } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Zap, Radio } from "lucide-react";
import { ExecutionModal, type ExecutionPlan } from "@/components/sentinel/ExecutionModal";

export const Route = createFileRoute("/app/signals")({
  component: SignalsPage,
});

const riskColor: Record<RiskLevel, string> = {
  LOW: "text-success border-success/40 bg-success/10",
  MEDIUM: "text-warning border-warning/40 bg-warning/10",
  HIGH: "text-destructive border-destructive/40 bg-destructive/10",
  CRITICAL: "text-destructive border-destructive/60 bg-destructive/20",
};

function SignalsPage() {
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
                {s.category}
              </span>
              <span
                className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${riskColor[s.risk]}`}
              >
                RISK {s.risk}
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{s.reasoning}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border/60 bg-surface/50 p-2.5">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">
                  Suggested Trade
                </div>
                <div className="mt-1 text-xs text-foreground">{s.trade}</div>
              </div>
              <div className="rounded-md border border-border/60 bg-surface/50 p-2.5">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">Upside</div>
                <div className="mt-1 text-xs font-mono text-success">{s.upside}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSignalId(s.id)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition glow-primary"
            >
              <Zap className="h-3.5 w-3.5" /> Execute on SoDEX
            </button>
          </motion.div>
        ))}
      </div>

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

function buildPlanFromSignal(signal: (typeof signals)[number]): ExecutionPlan {
  const title = signal.title.toLowerCase();

  if (title.includes("ai sector")) {
    return {
      from: "USDC",
      to: "AI Index Basket",
      sizeUsd: 7_500,
      route: "SoDEX · 2 hops",
      reason: signal.trade,
      riskProfile: "Moderate",
    };
  }

  if (title.includes("eth mean reversion")) {
    return {
      from: "ETH",
      to: "ETH/BTC",
      sizeUsd: 9_000,
      route: "SoDEX · direct",
      reason: signal.trade,
      riskProfile: "Aggressive",
    };
  }

  if (title.includes("solana")) {
    return {
      from: "USDC",
      to: "SOL + JUP",
      sizeUsd: 6_200,
      route: "SoDEX · 2 hops",
      reason: signal.trade,
      riskProfile: "Moderate",
    };
  }

  return {
    from: "USDC",
    to: "ONDO + USDY",
    sizeUsd: 5_400,
    route: "SoDEX · direct",
    reason: signal.trade,
    riskProfile: "Conservative",
  };
}
