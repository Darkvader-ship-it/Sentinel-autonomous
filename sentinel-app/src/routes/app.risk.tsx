import { createFileRoute } from "@tanstack/react-router";
import {
  riskWarnings as fallbackWarnings,
  riskScore as fallbackRiskScore,
  type RiskLevel,
} from "@/lib/mock-data";
import { ShieldAlert, AlertTriangle, Brain } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";

export const Route = createFileRoute("/app/risk")({
  component: RiskPage,
});

const levelStyle: Record<RiskLevel, string> = {
  LOW: "border-success/40 bg-success/5 text-success",
  MEDIUM: "border-warning/40 bg-warning/5 text-warning",
  HIGH: "border-destructive/40 bg-destructive/5 text-destructive",
  CRITICAL: "border-destructive/60 bg-destructive/10 text-destructive",
};

function RiskPage() {
  const { snapshot } = useMarketSnapshot();
  const riskWarnings = snapshot?.riskWarnings ?? fallbackWarnings;
  const riskScore = snapshot?.risk.score ?? fallbackRiskScore;
  const reasoning = snapshot?.reasoning;
  const signalCount = snapshot?.signals.length ?? 0;

  const riskLabel: RiskLevel =
    snapshot?.risk.level ??
    (riskScore >= 85 ? "CRITICAL" : riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW");

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-warning mb-1">
        <ShieldAlert className="h-3.5 w-3.5" /> Risk Sentinel
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Global Market Threats</h1>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        Real-time monitoring of macro events, liquidity stress, and on-chain anomalies.
      </p>

      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Composite Risk Score
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-6xl font-bold text-warning">{riskScore}</span>
              <span className="text-lg text-muted-foreground">/ 100</span>
              <span
                className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
                  riskLabel === "CRITICAL"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : riskLabel === "HIGH"
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : riskLabel === "MEDIUM"
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : "border-success/40 bg-success/10 text-success"
                }`}
              >
                {riskLabel}
              </span>
            </div>
          </div>
          {reasoning && (
            <div className="text-xs text-muted-foreground max-w-sm">{reasoning.summary}</div>
          )}
        </div>
        <div className="mt-5 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success via-warning to-destructive"
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>0 calm</span>
          <span>50 normal</span>
          <span>100 storm</span>
        </div>
        {reasoning && (
          <p className="mt-4 text-xs text-foreground/70 leading-relaxed border-t border-border/40 pt-3">
            {reasoning.reasoning}
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 mb-6">
        {riskWarnings.map((w) => (
          <div key={w.id} className={`rounded-xl border p-4 ${levelStyle[w.level]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold text-foreground">{w.title}</span>
              </div>
              <span className="font-mono text-[10px]">{w.timeWindow}</span>
            </div>
            <p className="mt-2 text-xs text-foreground/85 leading-relaxed">{w.detail}</p>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-wider opacity-80">
              {w.level}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-2">
          <Brain className="h-3.5 w-3.5" /> Sentinel Recommends
        </div>
        <ul className="space-y-2 text-sm text-foreground/90">
          {buildRecommendationList(riskScore, signalCount, reasoning?.suggestedAction).map(
            (r, i) => (
              <li key={i}>• {r}</li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

function buildRecommendationList(
  riskScore: number,
  signalCount: number,
  suggestedAction?: string,
): string[] {
  const recs: string[] = [];

  if (suggestedAction) {
    recs.push(suggestedAction);
  }

  if (riskScore >= 70) {
    recs.push("Reduce leveraged positions by 20% — risk score is elevated.");
    recs.push("Move 5-8% of portfolio into USDC as tactical hedge.");
    recs.push("Set conditional buy orders 3-5% below spot on majors.");
    recs.push("Avoid new long entries on high-beta tokens until risk subsides.");
  } else if (riskScore >= 40) {
    recs.push("Maintain current positions but tighten stop-losses by 10%.");
    recs.push("Keep 25% dry powder for drawdown opportunities.");
    recs.push("Focus on high-conviction narratives with 3% trailing stops.");
  } else {
    recs.push("Risk-on environment — consider increasing high-conviction exposure.");
    recs.push("Scale into quality dips with a 15% trail-stop.");
    recs.push(`Monitor ${signalCount} active signals for breakout confirmation.`);
  }

  return recs;
}
