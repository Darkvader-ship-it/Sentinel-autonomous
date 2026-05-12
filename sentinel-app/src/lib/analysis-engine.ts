import type {
  AnalysisResult,
  MarketContext,
  RiskProfile,
  RiskSnapshot,
  StructuredSignal,
} from "@/lib/sentinel-types";
import type { RecommendationResult } from "@/lib/sentinel-types";

/**
 * Analysis Engine: Constructs a logical market narrative via inference.
 * This moves away from random templates to data-driven synthesis.
 */
function synthesizeReasoning(
  context: MarketContext,
  risk: RiskSnapshot,
  riskProfile: RiskProfile,
): { summary: string; reasoning: string } {
  const btc = context.prices.find(p => p.symbol === "BTC");
  const dxy = context.prices.find(p => p.symbol === "DXY");
  
  const isBtcWeak = (btc?.change24h ?? 0) < -1.5;
  const isDxyStrong = (dxy?.price ?? 0) > 104.5;
  const isEtfStressed = context.etfOutflowPct > 10;

  // Build Summary
  let summary = "";
  if (isBtcWeak && isEtfStressed) {
    summary = "Systemic pressure detected: BTC weakness compounding with ETF outflows.";
  } else if (isBtcWeak) {
    summary = "Technical correction in progress: BTC majors leading a broader tape pullback.";
  } else if (isDxyStrong) {
    summary = "Macro headwind: DXY strength is suppressing risk-on conviction.";
  } else {
    summary = `Market regime: ${context.narrative.split('.')[0]}.`;
  }

  // Build Granular Reasoning
  const reasons: string[] = [];
  
  if (isEtfStressed) {
    reasons.push(`ETF outflows at ${context.etfOutflowPct.toFixed(1)}% indicate a cooling of institutional demand, historically a leading indicator for local tops.`);
  } else {
    reasons.push(`ETF flow stability suggests institutional absorption is neutralizing spot selling pressure.`);
  }

  if (isDxyStrong) {
    reasons.push(`DXY at ${dxy?.price.toFixed(2)} is creating a liquidity vacuum, making it difficult for alts to sustain breakouts.`);
  }

  if (context.rotationTheme.includes("Solana")) {
    reasons.push("Relative strength in the Solana ecosystem suggests a rotation is underway even as majors consolidate.");
  }

  if (risk.score > 70) {
    reasons.push("Risk score is critical. Prioritize capital preservation until the macro window clears.");
  }

  const profileNote = riskProfile === "Conservative" 
    ? "Risk-adjusted bias: Capital preservation is paramount. Minimize high-beta exposure."
    : "Tactical bias: Selective risk is acceptable in high-conviction rotation themes.";

  return {
    summary,
    reasoning: `${reasons.join(" ")} ${profileNote}`.trim()
  };
}

export function buildAnalysis(
  context: MarketContext,
  signals: StructuredSignal[],
  risk: RiskSnapshot,
  recommendations: RecommendationResult,
  riskProfile: RiskProfile = "Moderate",
): AnalysisResult {
  const { summary, reasoning } = synthesizeReasoning(context, risk, riskProfile);

  return {
    summary,
    reasoning,
    riskLevel: risk.level,
    suggestedAction: recommendations.primaryAction,
    confidence: Math.min(95, 70 + (signals.length * 5)),
  };
}
