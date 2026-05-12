import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";
import { buildEtfSignals } from "@/lib/signals/etfSignals";
import { buildLiquiditySignals } from "@/lib/signals/liquiditySignals";
import { buildMacroSignals } from "@/lib/signals/macroSignals";
import { buildRiskSignals } from "@/lib/signals/riskSignals";

export function buildStructuredSignals(context: MarketContext): StructuredSignal[] {
  return [
    ...buildEtfSignals(context),
    ...buildLiquiditySignals(context),
    ...buildMacroSignals(context),
    ...buildRiskSignals(context),
  ];
}
