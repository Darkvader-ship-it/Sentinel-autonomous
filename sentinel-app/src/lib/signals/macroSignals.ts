import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildMacroSignals(context: MarketContext): StructuredSignal[] {
  if (context.macroEvents.length > 0) {
    return [
      {
        id: "macro-volatility",
        type: "Macro Volatility Warning",
        severity: "HIGH",
        confidence: 74,
        summary: "Macro catalysts are compressing conviction.",
        explanation:
          "Scheduled macro windows tend to suppress leverage and widen spreads, so position sizing should be smaller until the event passes.",
        context: ["Macro", "Volatility", "Stops"],
      },
    ];
  }

  return [
    {
      id: "macro-quiet",
      type: "Macro Signal",
      severity: "LOW",
      confidence: 60,
      summary: "No major macro catalysts on the horizon.",
      explanation:
        "The macro calendar is clear for the near term. Markets are likely to trade on technicals and flows rather than event risk.",
      context: ["Macro", "Quiet", "Technical"],
    },
  ];
}
