import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildMacroSignals(context: MarketContext): StructuredSignal[] {
  if (!context.macroEvents.length) return [];

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
