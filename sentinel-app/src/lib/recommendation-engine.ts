import type {
  MarketContext,
  RecommendationResult,
  RiskProfile,
  RiskSnapshot,
  StructuredSignal,
} from "@/lib/sentinel-types";

/**
 * Recommendation Engine: Transforms raw risk and signals into actionable strategy.
 * This is the "Brain" that connects observation to execution.
 */
export function buildRecommendations(
  context: MarketContext,
  signals: StructuredSignal[],
  risk: RiskSnapshot,
  riskProfile: RiskProfile = "Moderate",
): RecommendationResult {
  const isHighRisk = risk.score >= 70;
  const isModerateRisk = risk.score >= 40 && risk.score < 70;
  const rotationTheme = context.rotationTheme || "Majors";

  // Primary Action logic: Data-driven decision making
  let primaryAction: string;
  if (isHighRisk) {
    primaryAction = `De-risk into ${context.prices.find(p => p.symbol === "USDC") ? "USDC" : "Stables"}. Reduce leverage to 0.0x and wait for ${context.macroEvents[0] || "volatility"} to subside.`;
  } else if (isModerateRisk) {
    primaryAction = `Hedge and Rotate. Maintain 25% dry powder. Prefer high-conviction entries in ${rotationTheme} with tight 3% stops.`;
  } else {
    primaryAction = `Aggressive Accumulation. Capitalize on ${rotationTheme} strength. Size up into quality dips with a 15% trail-stop.`;
  }

  // Defensive Actions: Specific risk mitigation steps
  const defensiveActions: string[] = [];
  if (context.etfOutflowPct > 10) {
    defensiveActions.push(`Reduce BTC/ETH exposure by 15% to buffer against ETF-driven downside.`);
  }
  if (context.unlockPressure > 70) {
    defensiveActions.push(`Avoid mid-cap tokens with pending supply unlocks in the next 72h.`);
  }
  if (context.btcVolatility > 5) {
    defensiveActions.push(`Widen stop-losses by 200bps to avoid being swept by high-frequency volatility.`);
  }
  if (defensiveActions.length === 0) {
    defensiveActions.push("Maintain standard risk-parity positioning.");
  }

  // Opportunity Actions: Concrete trade ideas
  const opportunityActions: string[] = [];
  if (context.rotationTheme.includes("AI") || context.rotationTheme.includes("FET")) {
    opportunityActions.push(`Scale into FET/USDC on SoDEX to capture the AI narrative momentum.`);
  }
  if (context.rotationTheme.includes("SOL") || context.rotationTheme.includes("Solana")) {
    opportunityActions.push(`Increase SOL weighting. Look for entry at ${context.prices.find(p => p.symbol === "SOL")?.price ? (context.prices.find(p => p.symbol === "SOL")!.price * 0.98).toFixed(2) : "support"}.`);
  }
  if (risk.score < 30 && context.liquidityChangePct > 100) {
    opportunityActions.push(`Deploy sidelined capital into "Top Performers" basket via SoDEX auto-balancer.`);
  }
  
  // Ensure we always have some opportunities
  if (opportunityActions.length === 0) {
    opportunityActions.push(`Monitor ${rotationTheme} for breakout confirmation above 24h highs.`);
    opportunityActions.push("Keep limit orders active at key liquidity clusters.");
  }

  // Profile-based overrides
  if (riskProfile === "Conservative" && isModerateRisk) {
    primaryAction = "Capital Preservation Mode. Exit all non-major positions until risk score drops below 40.";
    defensiveActions.unshift("Convert 40% of alt-holdings into USDC/USDT immediately.");
  } else if (riskProfile === "Aggressive" && !isHighRisk) {
    primaryAction = `High-Beta Alpha. Leverage ${rotationTheme} momentum. Target 2.5x volatility-adjusted returns.`;
    opportunityActions.unshift(`Aggressive long on ${rotationTheme} leaders with no initial stops.`);
  }

  return {
    primaryAction,
    defensiveActions,
    opportunityActions,
  };
}
