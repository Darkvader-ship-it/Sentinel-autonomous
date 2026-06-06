import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildRiskSignals(context: MarketContext): StructuredSignal[] {
  if (context.unlockPressure >= 70) {
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

  return [
    {
      id: "supply-normal",
      type: "Supply Signal",
      severity: "LOW",
      confidence: 70,
      summary: "No significant token unlock pressure detected.",
      explanation:
        "Token unlock schedules are clear for the near term. Supply-side risk is minimal, reducing the chance of unexpected dilution events.",
      context: ["Supply", "Normal", "Unlocks"],
    },
  ];
}
