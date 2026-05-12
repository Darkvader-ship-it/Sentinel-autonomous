import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildEtfSignals(context: MarketContext): StructuredSignal[] {
  if (context.etfOutflowPct < 12) return [];

  return [
    {
      id: "etf-risk",
      type: "ETF Risk Signal",
      severity: "HIGH",
      confidence: 87,
      summary: "BTC ETF outflows are weakening institutional risk appetite.",
      explanation:
        "Outflows above the normal band typically precede short-term downside pressure in majors and wider market de-leveraging.",
      context: ["ETF flows", "Risk-off", "Majors"],
    },
  ];
}
