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

const DEFAULT_EXECUTIONS: ExecutionRecord[] = [
  {
    id: "exec-1",
    status: "filled",
    from: "USDC",
    to: "ETH",
    sizeUsd: 8200,
    route: "SoDEX · 3 hops",
    slippageBps: 8,
    estimatedFeesUsd: 5.06,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "exec-2",
    status: "filled",
    from: "BTC",
    to: "USDC",
    sizeUsd: 5600,
    route: "SoDEX · direct",
    slippageBps: 6,
    estimatedFeesUsd: 3.63,
    createdAt: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
  },
  {
    id: "exec-3",
    status: "pending",
    from: "USDC",
    to: "FET",
    sizeUsd: 2400,
    route: "SoDEX · 2 hops",
    slippageBps: 11,
    estimatedFeesUsd: 2.07,
    createdAt: new Date().toISOString(),
  },
];

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

const ls: KeyValueNamespace = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota exceeded */
    }
  },
  delete: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

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

export function buildRiskWarnings(riskScore: number): RiskWarning[] {
  return [
    {
      id: "r1",
      title: "CPI Print — 3 Hours",
      level: riskScore >= 70 ? "HIGH" : "MEDIUM",
      detail: "Consensus 2.9% YoY. Surprise tolerance ±10bps. Expect 1.5-3% spot volatility.",
      timeWindow: "3h",
    },
    {
      id: "r2",
      title: "BTC ETF Outflow Stress",
      level: riskScore >= 55 ? "MEDIUM" : "LOW",
      detail: "Net outflows $312M over 48h. Threshold for cascade: $500M.",
      timeWindow: "Active",
    },
    {
      id: "r3",
      title: "Funding Rate Extremes",
      level: riskScore >= 50 ? "MEDIUM" : "LOW",
      detail: "Perp funding on SOL > 0.08% / 8h. Crowded long — squeeze risk elevated.",
      timeWindow: "Active",
    },
    {
      id: "r4",
      title: "Liquidity Thinning — Asia Open",
      level: riskScore >= 80 ? "MEDIUM" : "LOW",
      detail: "Order book depth at 1% reduced 22% vs 7d avg.",
      timeWindow: "9h",
    },
  ];
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
