import type { ExecutionRequest, ExecutionResponse } from "@/lib/sentinel-types";
import type { DexClient } from "@/lib/dex-client";

interface SoDexConfig {
  apiUrl: string;
  apiKey: string;
}

export function createSoDexClient(config: SoDexConfig): DexClient {
  return {
    async preview(request: ExecutionRequest): Promise<ExecutionResponse> {
      const params = new URLSearchParams({
        from: request.from,
        to: request.to,
        amount: request.sizeUsd.toString(),
        slippageBps: (request.slippageBps ?? 12).toString(),
      });

      const res = await fetch(`${config.apiUrl}/quote?${params}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`SoDEX quote failed: ${res.status}`);
      }

      const quote = await res.json();

      return {
        status: "preview",
        tradePath: `${request.from} → ${request.to}`,
        route: quote.route ?? `SoDEX · ${quote.hops ?? 1} hops`,
        slippageBps: quote.slippageBps ?? request.slippageBps ?? 12,
        estimatedFeesUsd: quote.estimatedFeesUsd ?? 0,
        expectedOutcome: quote.expectedOutcome ?? "Pending execution.",
        transactionId: `preview-${Date.now().toString(36)}`,
        expectedOutputAmount: quote.expectedOutputAmount ?? 0,
        expectedOutputSymbol: request.to,
      };
    },

    async submit(request: ExecutionRequest): Promise<ExecutionResponse> {
      const res = await fetch(`${config.apiUrl}/swap`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: request.from,
          to: request.to,
          amount: request.sizeUsd,
          slippageBps: request.slippageBps ?? 12,
          route: request.route,
        }),
      });

      if (!res.ok) {
        throw new Error(`SoDEX swap failed: ${res.status}`);
      }

      const result = await res.json();

      return {
        status: "submitted",
        tradePath: `${request.from} → ${request.to}`,
        route: result.route ?? `SoDEX · ${result.hops ?? 1} hops`,
        slippageBps: result.slippageBps ?? request.slippageBps ?? 12,
        estimatedFeesUsd: result.estimatedFeesUsd ?? 0,
        expectedOutcome: result.expectedOutcome ?? "Submitted.",
        transactionId: result.transactionId ?? `tx-${Date.now().toString(36)}`,
        expectedOutputAmount: result.expectedOutputAmount ?? 0,
        expectedOutputSymbol: request.to,
      };
    },
  };
}
