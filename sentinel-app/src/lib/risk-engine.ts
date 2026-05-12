import type { MarketContext, RiskSnapshot, StructuredSignal } from "@/lib/sentinel-types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function levelFromScore(score: number): RiskSnapshot["level"] {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

/**
 * Risk Engine: Calculates a unified Risk Score (0-100) using multi-factor analysis.
 * Factors: Macro Exposure, Liquidity Depth, ETF Flow Sentiment, and Signal Density.
 */
export function scoreRisk(context: MarketContext, signals: StructuredSignal[]): RiskSnapshot {
  const reasons: string[] = [];

  // 1. ETF Stress Factor (Weighted 30%)
  const etfStress = clamp(context.etfOutflowPct * 2.5, 0, 30);
  if (etfStress > 20) reasons.push("Extreme ETF outflow pressure detected.");
  else if (etfStress > 10) reasons.push("Moderate ETF outflow stress.");

  // 2. Macro Catalyst Factor (Weighted 25%)
  const macroFactor = context.macroEvents.length * 8;
  const macroStress = clamp(macroFactor, 0, 25);
  if (context.macroEvents.some(e => e.includes("expiry") || e.includes("rebalancing"))) {
    reasons.push("Calendar event risk (options/rebalancing) is clustering.");
  }

  // 3. Liquidity & Volatility Cluster (Weighted 25%)
  const volStress = clamp(context.btcVolatility * 3, 0, 15);
  const liqStress = context.liquidityChangePct > 120 ? 10 : 0;
  const clusterStress = clamp(volStress + liqStress, 0, 25);
  if (context.btcVolatility > 4) reasons.push("Intraday volatility is exceeding the 30-day mean.");

  // 4. Signal Density & Severity (Weighted 20%)
  const highSignals = signals.filter(s => s.severity === "HIGH" || s.severity === "CRITICAL").length;
  const signalStress = clamp(highSignals * 10 + signals.length * 2, 0, 20);
  if (highSignals > 0) reasons.push(`${highSignals} critical market alerts are currently active.`);

  // Final Aggregation
  const rawScore = etfStress + macroStress + clusterStress + signalStress;
  const score = Math.round(clamp(rawScore, 5, 100));

  // Ensure we always have at least 3 high-signal reasons
  if (reasons.length < 3) {
    if (score < 40) reasons.push("Broader market correlations remain stable.");
    else reasons.push("Monitor rotation themes for divergence from majors.");
  }

  return {
    score,
    level: levelFromScore(score),
    reasons: reasons.slice(0, 4),
  };
}
