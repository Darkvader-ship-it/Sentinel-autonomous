import type { ExecutionRequest, ExecutionResponse, RiskProfile } from "@/lib/sentinel-types";
import { getDexClient } from "@/lib/dex-client";

export async function previewExecution(request: ExecutionRequest): Promise<ExecutionResponse> {
  return getDexClient().preview(request);
}

export async function submitExecution(
  request: ExecutionRequest & { riskProfile?: RiskProfile },
): Promise<ExecutionResponse> {
  return getDexClient().submit(request);
}
