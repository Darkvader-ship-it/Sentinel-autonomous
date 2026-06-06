import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export function buildEtfSignals(context: MarketContext): StructuredSignal[] {
  if (context.etfOutflowPct >= 12) {
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

  return [
    {
      id: "etf-stable",
      type: "ETF Flow Signal",
      severity: "LOW",
      confidence: 72,
      summary: "ETF flows are neutral — no institutional stress detected.",
      explanation:
        "BTC ETF flows remain within normal bands. Institutional positioning is stable, reducing the likelihood of a cascade event.",
      context: ["ETF flows", "Stable", "Institutional"],
    },
  ];
}
