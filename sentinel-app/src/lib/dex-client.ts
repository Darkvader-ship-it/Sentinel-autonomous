import type { ExecutionRequest, ExecutionResponse } from "@/lib/sentinel-types";
import { createMockDexClient } from "@/lib/dex-mock-client";
import { createSoDexClient } from "@/lib/dex-sodex";
import { createJupiterClient } from "@/lib/dex-jupiter";

export interface DexClient {
  preview(request: ExecutionRequest): Promise<ExecutionResponse>;
  submit(request: ExecutionRequest): Promise<ExecutionResponse>;
}

/**
 * Factory to detect and return the most appropriate DEX client.
 * Prioritizes real integrations (Jupiter, SoDEX) over mocks.
 */
function detectDexClient(): DexClient {
  // 1. Check for Jupiter (Priority for Solana assets)
  const jupRpc = import.meta.env.VITE_JUPITER_RPC_URL as string | undefined;
  if (jupRpc) {
    return createJupiterClient({ 
      rpcUrl: jupRpc, 
      apiKey: import.meta.env.VITE_JUPITER_API_KEY as string | undefined 
    });
  }

  // 2. Check for SoDEX (Alternative real provider)
  const soDexUrl = import.meta.env.VITE_SODEX_API_URL as string | undefined;
  const soDexKey = import.meta.env.VITE_SODEX_API_KEY as string | undefined;
  if (soDexUrl && soDexKey) {
    return createSoDexClient({ apiUrl: soDexUrl, apiKey: soDexKey });
  }

  // 3. Fallback to high-fidelity Mock for demo/testing
  console.warn("Sentinel: No real DEX providers configured. Falling back to Mock client.");
  return createMockDexClient();
}

let activeClient: DexClient = detectDexClient();

/**
 * Allows manual override of the DEX client (e.g., during onboarding or tests).
 */
export function setDexClient(client: DexClient) {
  activeClient = client;
}

/**
 * Returns the active DEX client instance.
 */
export function getDexClient(): DexClient {
  return activeClient;
}
