import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildLiquiditySignals(context: MarketContext): StructuredSignal[] {
  if (context.liquidityChangePct < 120) return [];

  return [
    {
      id: "liquidity-rotation",
      type: "Liquidity Rotation Signal",
      severity: "MEDIUM",
      confidence: 81,
      summary: "Capital is rotating into Solana and adjacent AI assets.",
      explanation:
        "Rising stablecoin inflows and concentrated spot demand usually indicate the market is positioning ahead of a narrative rotation.",
      context: ["Liquidity", "Rotation", "AI"],
    },
  ];
}
