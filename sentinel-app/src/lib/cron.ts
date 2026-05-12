import { createSentinelStore } from "@/lib/sentinel-store";
import { refreshMarketSnapshot } from "@/lib/intelligence-engine";

export async function runSentinelRefresh(env: unknown) {
  const snapshot = await refreshMarketSnapshot(env, { forceRefresh: true });
  const store = createSentinelStore(env);
  await store.setSnapshot(snapshot);
  return snapshot;
}
