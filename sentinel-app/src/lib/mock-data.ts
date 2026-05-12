export type Impact = "HIGH" | "MEDIUM" | "LOW";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FeedItem {
  id: string;
  category: string;
  title: string;
  interpretation: string;
  impact: Impact;
  confidence: number;
  actions: string[];
  time: string;
}

export const feedItems: FeedItem[] = [
  {
    id: "1",
    category: "MARKET EVENT",
    title: "BTC ETF Outflows Spike 14%",
    interpretation:
      "Institutional risk appetite weakening. Short-term downside volatility increasing across majors.",
    impact: "HIGH",
    confidence: 87,
    actions: ["Reduce leveraged exposure by 15%", "Rotate idle USDC into ETH"],
    time: "2m ago",
  },
  {
    id: "2",
    category: "MACRO SIGNAL",
    title: "FOMC Minutes — Hawkish Tilt Detected",
    interpretation:
      "Language shift suggests delayed rate cuts. Risk assets historically underperform in 24-72h window.",
    impact: "MEDIUM",
    confidence: 74,
    actions: ["Hedge 20% of long exposure", "Watch DXY > 105.4"],
    time: "18m ago",
  },
  {
    id: "3",
    category: "LIQUIDITY SHIFT",
    title: "Stablecoin Inflows to Solana +$240M (24h)",
    interpretation:
      "Capital rotation pattern matches prior pre-rally setups. AI sector tokens leading bid.",
    impact: "MEDIUM",
    confidence: 81,
    actions: ["Scale into SOL ecosystem AI basket", "Set 8% trailing stop"],
    time: "47m ago",
  },
  {
    id: "4",
    category: "TOKEN UNLOCK",
    title: "ARB — 92.6M Tokens Unlocking in 36h",
    interpretation:
      "Supply event ~2.1% of circulating. Historical pattern shows 4-7% drawdown into unlock.",
    impact: "LOW",
    confidence: 68,
    actions: ["Avoid new long entries", "Consider short-dated put"],
    time: "1h ago",
  },
  {
    id: "5",
    category: "ON-CHAIN",
    title: "Whale Accumulation — ETH +$182M Net Flow",
    interpretation:
      "5 entities classified as smart money increased ETH exposure during recent dip.",
    impact: "HIGH",
    confidence: 91,
    actions: ["Mirror accumulation: 10% USDC → ETH", "Set conviction alert"],
    time: "2h ago",
  },
];

export interface Signal {
  id: string;
  title: string;
  category: string;
  reasoning: string;
  trade: string;
  risk: RiskLevel;
  upside: string;
}

export const signals: Signal[] = [
  {
    id: "s1",
    title: "AI Sector Liquidity Rising",
    category: "Rotation",
    reasoning:
      "Historical patterns show capital rotating from BTC into high-beta AI assets following ETF outflow regimes.",
    trade: "USDC → AI Index Basket (FET, RNDR, TAO)",
    risk: "MEDIUM",
    upside: "+12-18%",
  },
  {
    id: "s2",
    title: "ETH Mean Reversion Setup",
    category: "Momentum",
    reasoning:
      "ETH/BTC ratio at 90-day low. RSI divergence forming on 4h. Funding turned negative.",
    trade: "Long ETH/BTC pair",
    risk: "LOW",
    upside: "+6-9%",
  },
  {
    id: "s3",
    title: "Solana DEX Volume Breakout",
    category: "Narrative",
    reasoning: "DEX volume on SOL exceeded ETH for 5 consecutive days — first time since March.",
    trade: "Accumulate SOL + JUP",
    risk: "MEDIUM",
    upside: "+15-22%",
  },
  {
    id: "s4",
    title: "RWA Treasury Inflows",
    category: "Macro",
    reasoning:
      "Tokenized treasury TVL +$1.2B MoM. Institutional preference for yield-bearing on-chain assets.",
    trade: "Allocate 10% to ONDO + USDY",
    risk: "LOW",
    upside: "+4-7%",
  },
];

export const portfolio = {
  totalValue: 184_320,
  pnl24h: 3_412,
  pnl24hPct: 1.89,
  pnl7d: -2_140,
  pnl7dPct: -1.15,
  holdings: [
    { symbol: "ETH", name: "Ethereum", value: 64_200, allocation: 34.8, change: 2.1 },
    { symbol: "BTC", name: "Bitcoin", value: 48_900, allocation: 26.5, change: -0.8 },
    { symbol: "SOL", name: "Solana", value: 28_100, allocation: 15.2, change: 4.6 },
    { symbol: "USDC", name: "USD Coin", value: 22_000, allocation: 11.9, change: 0.0 },
    { symbol: "FET", name: "Fetch.ai", value: 12_400, allocation: 6.7, change: 8.2 },
    { symbol: "ONDO", name: "Ondo", value: 8_720, allocation: 4.7, change: 1.4 },
  ],
  exposure: [
    { sector: "Majors", value: 61.3 },
    { sector: "AI", value: 14.8 },
    { sector: "L1/L2", value: 15.2 },
    { sector: "RWA", value: 4.7 },
    { sector: "Stables", value: 11.9 },
  ],
};

export const portfolioHistory = [
  { day: "Mon", value: 178000 },
  { day: "Tue", value: 181500 },
  { day: "Wed", value: 176800 },
  { day: "Thu", value: 180200 },
  { day: "Fri", value: 182400 },
  { day: "Sat", value: 180900 },
  { day: "Sun", value: 184320 },
];

export const tickers = [
  { symbol: "BTC", price: 96420, change: -0.82 },
  { symbol: "ETH", price: 3284, change: 2.14 },
  { symbol: "SOL", price: 218.6, change: 4.61 },
  { symbol: "DXY", price: 104.8, change: 0.31 },
];

export interface RiskWarning {
  id: string;
  title: string;
  level: RiskLevel;
  detail: string;
  timeWindow: string;
}

export const riskWarnings: RiskWarning[] = [
  {
    id: "r1",
    title: "CPI Print — 3 Hours",
    level: "HIGH",
    detail: "Consensus 2.9% YoY. Surprise tolerance ±10bps. Expect 1.5-3% spot volatility.",
    timeWindow: "3h",
  },
  {
    id: "r2",
    title: "BTC ETF Outflow Stress",
    level: "MEDIUM",
    detail: "Net outflows $312M over 48h. Threshold for cascade: $500M.",
    timeWindow: "Active",
  },
  {
    id: "r3",
    title: "Funding Rate Extremes",
    level: "MEDIUM",
    detail: "Perp funding on SOL > 0.08% / 8h. Crowded long — squeeze risk elevated.",
    timeWindow: "Active",
  },
  {
    id: "r4",
    title: "Liquidity Thinning — Asia Open",
    level: "LOW",
    detail: "Order book depth at 1% reduced 22% vs 7d avg.",
    timeWindow: "9h",
  },
];

export const riskScore = 64; // 0-100
