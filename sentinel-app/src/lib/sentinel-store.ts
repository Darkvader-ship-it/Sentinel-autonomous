import type { RiskWarning } from "@/lib/mock-data";
import type {
  AlertRecord,
  ExecutionRecord,
  MarketSnapshot,
  UserProfile,
} from "@/lib/sentinel-types";

type KeyValueNamespace = {
  get: (key: string) => Promise<string | null> | string | null;
  set: (key: string, value: string) => Promise<void> | void;
  delete?: (key: string) => Promise<void> | void;
};

type PersistedState = {
  snapshot?: MarketSnapshot;
  profile: UserProfile;
  alerts: AlertRecord[];
  executions: ExecutionRecord[];
};

const DEFAULT_PROFILE: UserProfile = {
  wallet: "0x4a...e8f2",
  riskProfile: "Moderate",
  interests: ["BTC", "ETH", "AI", "DeFi", "SOL"],
  monitoring: "Enabled",
  notifications: "In-app + Email",
  onboardingComplete: false,
};

const DEFAULT_ALERTS: AlertRecord[] = [
  {
    id: "alert-etf",
    title: "BTC ETF outflows are still elevated",
    severity: "HIGH",
    body: "ETF outflows rising above the normal band typically precede short-term downside pressure.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "alert-macro",
    title: "Macro event window open",
    severity: "HIGH",
    body: "Expect wider spreads and lower conviction until the event risk clears.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "alert-rotation",
    title: "Rotation detected in AI / Solana baskets",
    severity: "MEDIUM",
    body: "Select names are attracting flows even while the broader tape stays defensive.",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_EXECUTIONS: ExecutionRecord[] = [];

function resolveNamespace(env: unknown): KeyValueNamespace | null {
  if (!env || typeof env !== "object") return null;
  const record = env as Record<string, unknown>;
  const candidate = record.SENTINEL_KV ?? record.KV ?? record.kv;
  if (!candidate || typeof candidate !== "object") return null;
  if (
    typeof (candidate as KeyValueNamespace).get !== "function" ||
    typeof (candidate as KeyValueNamespace).set !== "function"
  ) {
    return null;
  }
  return candidate as KeyValueNamespace;
}

function createFallbackStore(): KeyValueNamespace {
  const store = new Map<string, string>();
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => { store.set(key, value); },
    delete: (key: string) => { store.delete(key); },
  };
}

function tryLocalStorage(): KeyValueNamespace | null {
  try {
    if (typeof localStorage !== "undefined" && localStorage !== null) {
      return {
        get: (key: string) => localStorage.getItem(key),
        set: (key: string, value: string) => { localStorage.setItem(key, value); },
        delete: (key: string) => { localStorage.removeItem(key); },
      };
    }
  } catch { /* not available in Workers */ }
  return null;
}

const sharedMemory = createFallbackStore();
const ls: KeyValueNamespace = tryLocalStorage() ?? sharedMemory;

async function readState(env: unknown): Promise<PersistedState> {
  const kv = resolveNamespace(env) ?? ls;
  const rawProfile = await kv.get("sentinel:profile");
  const rawAlerts = await kv.get("sentinel:alerts");
  const rawExecutions = await kv.get("sentinel:executions");
  const rawSnapshot = await kv.get("sentinel:snapshot");

  return {
    snapshot: rawSnapshot ? (JSON.parse(rawSnapshot) as MarketSnapshot) : undefined,
    profile: rawProfile ? (JSON.parse(rawProfile) as UserProfile) : DEFAULT_PROFILE,
    alerts: rawAlerts ? (JSON.parse(rawAlerts) as AlertRecord[]) : [...DEFAULT_ALERTS],
    executions: rawExecutions
      ? (JSON.parse(rawExecutions) as ExecutionRecord[])
      : [...DEFAULT_EXECUTIONS],
  };
}

async function writeState(env: unknown, state: PersistedState): Promise<void> {
  const kv = resolveNamespace(env) ?? ls;
  await kv.set("sentinel:profile", JSON.stringify(state.profile));
  await kv.set("sentinel:alerts", JSON.stringify(state.alerts));
  await kv.set("sentinel:executions", JSON.stringify(state.executions));
  if (state.snapshot) {
    await kv.set("sentinel:snapshot", JSON.stringify(state.snapshot));
  }
}

export function createSentinelStore(env: unknown) {
  return {
    async getSnapshot(): Promise<MarketSnapshot | undefined> {
      const state = await readState(env);
      return state.snapshot;
    },
    async setSnapshot(snapshot: MarketSnapshot): Promise<void> {
      const state = await readState(env);
      await writeState(env, { ...state, snapshot });
    },
    async getProfile(): Promise<UserProfile> {
      const state = await readState(env);
      return state.profile;
    },
    async setProfile(profile: UserProfile): Promise<void> {
      const state = await readState(env);
      await writeState(env, { ...state, profile });
    },
    async listAlerts(): Promise<AlertRecord[]> {
      const state = await readState(env);
      return state.alerts;
    },
    async addAlert(alert: AlertRecord): Promise<void> {
      const state = await readState(env);
      await writeState(env, { ...state, alerts: [alert, ...state.alerts].slice(0, 25) });
    },
    async listExecutions(): Promise<ExecutionRecord[]> {
      const state = await readState(env);
      return state.executions;
    },
    async addExecution(execution: ExecutionRecord): Promise<void> {
      const state = await readState(env);
      await writeState(env, {
        ...state,
        executions: [execution, ...state.executions].slice(0, 25),
      });
    },
    async reset(): Promise<void> {
      await writeState(env, {
        profile: DEFAULT_PROFILE,
        alerts: [...DEFAULT_ALERTS],
        executions: [...DEFAULT_EXECUTIONS],
      });
    },
  };
}

export function buildRiskWarnings(
  riskScore: number,
  context?: {
    etfOutflowPct: number;
    btcVolatility: number;
    liquidityChangePct: number;
    unlockPressure: number;
    macroEvents: string[];
  },
): RiskWarning[] {
  const warnings: RiskWarning[] = [];

  // ETF outflow warning — content adapts to actual data
  const etfOutflowPct = context?.etfOutflowPct ?? 8;
  warnings.push({
    id: "r1",
    title: etfOutflowPct > 10
      ? `ETF Outflow Stress — ${etfOutflowPct.toFixed(1)}%`
      : "CPI Print — 3 Hours",
    level: riskScore >= 70 ? "HIGH" : "MEDIUM",
    detail: etfOutflowPct > 10
      ? `Net outflows elevated at ${etfOutflowPct.toFixed(1)}%. Threshold for cascade: 15%.`
      : "Consensus 2.9% YoY. Surprise tolerance ±10bps. Expect 1.5-3% spot volatility.",
    timeWindow: "3h",
  });

  // Volatility warning
  const btcVol = context?.btcVolatility ?? 2;
  warnings.push({
    id: "r2",
    title: btcVol > 4
      ? `BTC Volatility Spike — ${btcVol.toFixed(1)}x`
      : "BTC ETF Outflow Stress",
    level: riskScore >= 55 ? "MEDIUM" : "LOW",
    detail: btcVol > 4
      ? `Intraday volatility ${btcVol.toFixed(1)}x the 30-day mean. Position size accordingly.`
      : "Net outflows $312M over 48h. Threshold for cascade: $500M.",
    timeWindow: "Active",
  });

  // Funding / liquidity warning
  const liqPct = context?.liquidityChangePct ?? 100;
  warnings.push({
    id: "r3",
    title: liqPct > 120
      ? `Liquidity Rotation — ${liqPct.toFixed(0)}%`
      : "Funding Rate Extremes",
    level: riskScore >= 50 ? "MEDIUM" : "LOW",
    detail: liqPct > 120
      ? `Order book depth shifted ${liqPct.toFixed(0)}% vs 7d avg. Monitor spread widening.`
      : "Perp funding on SOL > 0.08% / 8h. Crowded long — squeeze risk elevated.",
    timeWindow: "Active",
  });

  // Macro event / supply pressure warning
  const hasMacro = (context?.macroEvents?.length ?? 0) > 0;
  const unlockPct = context?.unlockPressure ?? 50;
  warnings.push({
    id: "r4",
    title: hasMacro
      ? `${context!.macroEvents.length} Active Macro Events`
      : "Liquidity Thinning — Asia Open",
    level: riskScore >= 80 ? "MEDIUM" : "LOW",
    detail: hasMacro
      ? `Calendar risk from ${context!.macroEvents.length} events. Reduce high-beta exposure.`
      : `Unlock pressure at ${unlockPct.toFixed(0)}%. Order book depth at 1% reduced 22% vs 7d avg.`,
    timeWindow: hasMacro ? "48h" : "9h",
  });

  return warnings;
}

export function buildAlertFromSignal(signal: {
  id: string;
  severity: RiskWarning["level"];
  summary: string;
  explanation: string;
}): AlertRecord {
  return {
    id: `alert-${signal.id}`,
    title: signal.summary,
    severity: signal.severity,
    body: signal.explanation,
    createdAt: new Date().toISOString(),
  };
}
