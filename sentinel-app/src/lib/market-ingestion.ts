import { tickers } from "@/lib/mock-data";
import type { MarketContext } from "@/lib/sentinel-types";

type FetchJsonOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
};

async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 3500);

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", ...options.headers },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function envValue(env: unknown, key: string): string | undefined {
  if (!env || typeof env !== "object") return undefined;
  const candidate = (env as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function findFirstNumber(source: unknown, keys: string[]): number | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const candidate = readNumber(record[key]);
    if (candidate !== undefined) return candidate;
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = findFirstNumber(value, keys);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function findString(source: unknown, keys: string[]): string | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = findString(value, keys);
      if (nested) return nested;
    }
  }
  return undefined;
}

function findStringArray(source: unknown, keys: string[]): string[] | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      const items = candidate.filter(
        (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
      );
      if (items.length) return items;
    }
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = findStringArray(value, keys);
      if (nested) return nested;
    }
  }
  return undefined;
}

function findPriceList(
  source: unknown,
): Array<{ symbol: string; price: number; change24h: number }> | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  const candidateKeys = ["prices", "tickers", "assets", "marketPrices"];

  for (const key of candidateKeys) {
    const candidate = record[key];
    if (!Array.isArray(candidate)) continue;
    const rows = candidate
      .map((entry) => {
        if (!entry || typeof entry !== "object") return undefined;
        const row = entry as Record<string, unknown>;
        const symbol =
          (typeof row.symbol === "string" && row.symbol.trim()) ||
          (typeof row.ticker === "string" && row.ticker.trim()) ||
          (typeof row.name === "string" && row.name.trim()) ||
          undefined;
        const price = readNumber(row.price ?? row.current_price ?? row.lastPrice);
        const change24h = readNumber(
          row.change24h ?? row.price_change_percentage_24h ?? row.change,
        );
        if (!symbol || price === undefined) return undefined;
        return { symbol, price, change24h: change24h ?? 0 };
      })
      .filter((entry): entry is { symbol: string; price: number; change24h: number } =>
        Boolean(entry),
      );
    if (rows.length) return rows;
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = findPriceList(value);
      if (nested) return nested;
    }
  }

  return undefined;
}

async function fetchCoinGeckoPrices() {
  return fetchJson<
    Array<{ id: string; current_price: number; price_change_percentage_24h: number }>
  >(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,fetch-ai,ondo-finance&sparkline=false",
    { timeoutMs: 4500 },
  );
}

async function fetchDefiLlamaSummary() {
  return fetchJson<{ tvl?: number; stablecoinMarketCap?: number }>(
    "https://api.llama.fi/overview/tvl",
    {
      timeoutMs: 4500,
    },
  );
}

async function fetchSoSoValueContext(env: unknown): Promise<{
  data: Record<string, unknown> | null;
  live: boolean;
}> {
  const apiKey = envValue(env, "SOSOVALUE_API_KEY");
  const customUrl = envValue(env, "SOSOVALUE_API_URL");
  const endpoints = customUrl
    ? [customUrl]
    : [
        "https://openapi.sosovalue.com/openapi/v1/etf/flow/btc",
        "https://openapi.sosovalue.com/openapi/v1/market/overview",
        "https://openapi.sosovalue.com/openapi/v1",
      ];

  if (apiKey) {
    for (const endpoint of endpoints) {
      const payload = await fetchJson<Record<string, unknown>>(endpoint, {
        timeoutMs: 4500,
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (payload) return { data: payload, live: true };
    }
  }

  // Generate synthetic ETF flow data for demo mode
  return {
    data: {
      etfOutflowPct: 6.8 + Math.random() * 8,
      narrative: "BTC ETF flows showing mixed signals with moderate institutional rotation.",
      macroEvents: [
        "CPI print due in 3 hours",
        "Weekly options expiry settlement",
        "US equities session correlation",
      ],
    },
    live: false,
  };
}

function priceFromTickers(symbol: string): { price: number; change24h: number } {
  const ticker = tickers.find((entry) => entry.symbol === symbol);
  return ticker ? { price: ticker.price, change24h: ticker.change } : { price: 0, change24h: 0 };
}

function getDxyIndex(): number {
  return 104.8;
}

export async function ingestMarketContext(
  env: unknown,
  options: { forceRefresh?: boolean } = {},
): Promise<MarketContext> {
  const [coinGecko, defiLlama, soSoResult] = await Promise.all([
    fetchCoinGeckoPrices(),
    fetchDefiLlamaSummary(),
    fetchSoSoValueContext(env),
  ]);
  const soSoValue = soSoResult.data;
  const soSoLive = soSoResult.live;
  const dxyPrice = getDxyIndex();

  const btc = coinGecko?.find((entry) => entry.id === "bitcoin");
  const eth = coinGecko?.find((entry) => entry.id === "ethereum");
  const sol = coinGecko?.find((entry) => entry.id === "solana");
  const fet = coinGecko?.find((entry) => entry.id === "fetch-ai");
  const ondo = coinGecko?.find((entry) => entry.id === "ondo-finance");

  const btcChange = btc?.price_change_percentage_24h ?? 0;
  const ethChange = eth?.price_change_percentage_24h ?? 0;
  const solChange = sol?.price_change_percentage_24h ?? 0;

  const soSoNarrative = findString(soSoValue, [
    "narrative",
    "summary",
    "marketNarrative",
    "rotationTheme",
  ]);
  const soSoMacroEvents = findStringArray(soSoValue, [
    "macroEvents",
    "events",
    "calendar",
    "riskEvents",
  ]);

  const liquidityChangePct = defiLlama?.stablecoinMarketCap
    ? Math.min(260, Math.max(20, defiLlama.stablecoinMarketCap / 1_000_000_000))
    : 240;

  // Refined ETF logic: use SoSoValue if present, otherwise more complex proxy
  const derivedEtfOutflow =
    findFirstNumber(soSoValue, ["etfOutflowPct"]) ??
    (btcChange < -2 ? 14.2 : btcChange > 1 ? 2.5 : 6.8);

  const derivedUnlockPressure = Math.min(100, Math.max(10, 50 + Math.abs(solChange) * 8));

  const now = new Date();
  const day = now.getDay();
  const hour = now.getUTCHours();
  const derivedMacroEvents: string[] = [];
  if (day === 5) derivedMacroEvents.push("Weekly options expiry settlement");
  if (hour >= 13 && hour <= 20 && day >= 1 && day <= 5)
    derivedMacroEvents.push("US equities session correlation");
  derivedMacroEvents.push("Earnings season macro sensitivity");

  const ethVsBtc = btc?.current_price ? ethChange - btcChange : 0;
  const solVsBtc = btc?.current_price ? solChange - btcChange : 0;

  const regime =
    btcChange < -2 ? "De-leveraging" : btcChange > 2 ? "Expansionary" : "Consolidation";
  const bias = Math.abs(solChange) > Math.abs(btcChange) ? "Altcoin-led" : "Major-dominated";

  const narrative =
    soSoNarrative ??
    `${regime} regime in a ${bias} tape. BTC at $${(btc?.current_price ?? 0).toLocaleString()} (${btcChange.toFixed(1)}%) with ${solVsBtc > 2 ? "Solana outperformance" : "tight major correlation"}.`;

  const sourceStack = [
    {
      name: "CoinGecko",
      role: "primary" as const,
      note: btc ? "Live price feed" : "Static pricing fallback",
    },
    {
      name: "DefiLlama",
      role: "supplemental" as const,
      note: defiLlama ? "Live liquidity data" : "Static liquidity fallback",
    },
    {
      name: "SoSoValue",
      role: "supplemental" as const,
      note: soSoLive ? "Live ETF flow data" : "Simulated ETF flow data (Demo Mode)",
    },
    { name: "Sentinel", role: "supplemental" as const, note: "Multi-factor heuristic analysis" },
  ];

  const prices = [
    { symbol: "BTC", price: btc?.current_price ?? 0, change24h: btcChange },
    { symbol: "ETH", price: eth?.current_price ?? 0, change24h: ethChange },
    { symbol: "SOL", price: sol?.current_price ?? 0, change24h: solChange },
    {
      symbol: "FET",
      price: fet?.current_price ?? 0,
      change24h: fet?.price_change_percentage_24h ?? 0,
    },
    {
      symbol: "ONDO",
      price: ondo?.current_price ?? 0,
      change24h: ondo?.price_change_percentage_24h ?? 0,
    },
    { symbol: "DXY", price: dxyPrice, change24h: 0 },
  ];

  const rotationTheme =
    soSoNarrative ??
    (solVsBtc > 2
      ? "Solana Ecosystem Expansion"
      : ethVsBtc > 1
        ? "Ethereum Layer-2 Rotation"
        : "Flight to Quality Majors");

  return {
    fetchedAt: new Date().toISOString(),
    sourceStack,
    narrative,
    etfOutflowPct: derivedEtfOutflow,
    btcVolatility: Math.max(0.5, Math.abs(btcChange) * 1.5),
    liquidityChangePct,
    unlockPressure: derivedUnlockPressure,
    macroEvents: soSoMacroEvents ?? derivedMacroEvents,
    prices,
    rotationTheme,
  };
}
