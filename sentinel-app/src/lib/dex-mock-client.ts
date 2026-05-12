import type { ExecutionRequest, ExecutionResponse } from "@/lib/sentinel-types";
import type { DexClient } from "@/lib/dex-client";

const MOCK_PRICES: Record<string, number> = {
  USDC: 1,
  ETH: 3210,
  BTC: 98200,
  SOL: 178,
  FET: 1.82,
  ONDO: 1.45,
  JUP: 0.82,
  "AI Index Basket": 12.5,
  "SOL + JUP": 85.2,
  "ONDO + USDY": 2.1,
  "ETH/BTC": 0.0327,
};

function parseOutputSymbol(from: string, to: string): string {
  if (to === "ETH/BTC") return "ETH/BTC";
  if (to.includes("+")) return to;
  if (to.includes("Index")) return to;
  return to;
}

function getPrice(symbol: string): number {
  return MOCK_PRICES[symbol] ?? 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createMockDexClient(): DexClient {
  return {
    async preview(request: ExecutionRequest): Promise<ExecutionResponse> {
      const sizeBucket = request.sizeUsd >= 10_000 ? 3 : request.sizeUsd >= 5_000 ? 2 : 1;
      const profileAdjustment =
        request.riskProfile === "Conservative"
          ? 2
          : request.riskProfile === "Aggressive"
            ? -1
            : 0;
      const slippageBps = clamp(
        (request.slippageBps ?? 8) + sizeBucket * 3 + profileAdjustment,
        4,
        50,
      );
      const route =
        request.route ??
        (request.sizeUsd >= 10_000
          ? "SoDEX · 3 hops"
          : request.sizeUsd >= 5_000
            ? "SoDEX · 2 hops"
            : "SoDEX · direct");
      const routeHops = route.includes("3 hops") ? 3 : route.includes("2 hops") ? 2 : 1;
      const estimatedFeesUsd = Number((request.sizeUsd * 0.00055 + routeHops * 0.55).toFixed(2));
      const tradePath = `${request.from} → ${request.to}`;
      const outputSymbol = parseOutputSymbol(request.from, request.to);
      const priceInUsd = getPrice(outputSymbol);
      const netAmount = request.sizeUsd - estimatedFeesUsd;
      const expectedOutputAmount = Number((netAmount / priceInUsd).toFixed(priceInUsd < 1 ? 6 : 4));

      return {
        status: "preview",
        tradePath,
        route,
        slippageBps,
        estimatedFeesUsd,
        expectedOutcome:
          slippageBps <= 10
            ? "Execution quality looks tight with low route friction."
            : "Execution is still viable, but route depth and slippage should be watched closely.",
        transactionId: `preview-${Date.now().toString(36)}-${Math.floor(Math.random() * 10_000).toString(36)}`,
        expectedOutputAmount,
        expectedOutputSymbol: outputSymbol,
      };
    },

    async submit(request: ExecutionRequest): Promise<ExecutionResponse> {
      const preview = await this.preview(request);
      return {
        ...preview,
        status: "submitted",
        transactionId: `tx-${Date.now().toString(36)}-${Math.floor(Math.random() * 10_000).toString(36)}`,
      };
    },
  };
}
