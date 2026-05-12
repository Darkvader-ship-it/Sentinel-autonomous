import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildRiskSignals(context: MarketContext): StructuredSignal[] {
  if (context.unlockPressure < 70) return [];

  return [
    {
      id: "unlock-risk",
      type: "Supply Risk Signal",
      severity: "MEDIUM",
      confidence: 78,
      summary: "Token unlock pressure may widen short-term drawdowns.",
      explanation:
        "Large unlocks can add supply to already defensive markets, increasing slippage danger and reducing the quality of new entries.",
      context: ["Unlocks", "Liquidity", "Supply"],
    },
  ];
}
