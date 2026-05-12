# Sentinel

**AI-Curated Market Intelligence + One-Click Execution for On-Chain Traders**

> Built for the [Build Your One-Person On-Chain Finance Business with SoSoValue] Hackathon — Wave 1 delivery.
>
> **Wave 1** (✅ Complete): Real-time market data ingestion, multi-factor risk engine, AI-generated intelligence feed, portfolio tracking, one-click swap execution via SoDEX.
>
> **Wave 2** (Roadmap): AI trading copilot with natural-language strategy builder, Telegram alerts, social sentiment cross-referencing.
>
> **Wave 3** (Vision): Autonomous treasury management agent, institutional-grade risk monitoring dashboard, on-chain infrastructure for programmatic trading.

---

## Problem

Crypto traders are drowning in noise. Prices stream in real-time across thousands of assets. ETF flow data lives on one dashboard, wallet balances on another, macro calendars elsewhere. Liquidity shifts, token unlocks, funding rate extremes — each requires a different tool, different login, different mental model.

The result: **information asymmetry favors institutions** who have dedicated terminals, risk teams, and execution infrastructure. Retail and solo traders operate with fragmented tools, delayed data, and no systematic risk framework.

## Solution

Sentinel is a unified intelligence terminal that **ingests, analyzes, and executes** — all in one place.

```
External Data ──► Risk Engine ──► AI Analysis ──► Actionable Feed ──► One-Click Execution
```

It replaces six separate tools (pricing dashboard, ETF tracker, macro calendar, risk calculator, portfolio tracker, DEX aggregator) with a single interface that explains *what matters right now* and lets you act instantly.

---

## Core Loop (Winning Feature Set)

```
┌─────────────────────────────────────────────────────────────┐
│                     AI FEED                                  │
│  Live signals ranked by impact, confidence, and your risk   │
│  profile. No noise.                                         │
├─────────────────────────────────────────────────────────────┤
│                     MARKET ALERTS                            │
│  ETF outflow spikes, macro event windows, liquidity shifts, │
│  token unlock pressure — pushed in real-time.               │
├─────────────────────────────────────────────────────────────┤
│                     EXPLANATIONS                             │
│  Every signal includes why it matters and what it means for │
│  your portfolio. Not just data — understanding.             │
├─────────────────────────────────────────────────────────────┤
│                     RISK ENGINE                              │
│  Multi-factor scoring (ETF stress × macro × liquidity ×    │
│  signal density) → unified 0-100 risk score.                │
├─────────────────────────────────────────────────────────────┤
│                     ONE-CLICK EXECUTION                      │
│  From signal to swap in one click. Routes through SoDEX,   │
│  Jupiter, or mock execution.                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
                    ┌──────────────┐
                    │  CoinGecko   │  Live prices (BTC, ETH, SOL, FET, ONDO)
                    │  DefiLlama   │  Liquidity & TVL data
                    │  SoSoValue   │  BTC ETF flows, macro narrative (via API)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   market-    │  Raw data ingestion, normalized schema
                    │  ingestion   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   signals/   │  4 signal generators:
                    │              │    • etfSignals — ETF outflow stress
                    │              │    • liquiditySignals — Liquidity rotation
                    │              │    • macroSignals — Macro volatility
                    │              │    • riskSignals — Token unlock pressure
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  risk-engine │  Multi-factor: ETF(30%) + macro(25%)
                    │              │  + liquidity/vol(25%) + signals(20%)
                    │              │  → Unified RiskScore 0-100
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────────┐
     │ analysis-  │ │recommend- │ │ sentinel-    │
     │ engine     │ │ation-engine│ │ store        │
     │            │ │           │ │              │
     │ Narrative  │ │Primary    │ │KV / in-memory│
     │ synthesis  │ │action +   │ │persistence   │
     │ from data  │ │defensive  │ │              │
     │            │ │actions    │ │              │
     └────────────┘ └───────────┘ └──────────────┘
                           │
                    ┌──────▼───────┐
                    │ composeSnapshot() │  ← intelligence-engine.ts
                    │                  │
                    │ Assembles full  │
                    │ MarketSnapshot  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  HTTP API    │  GET /app/api/market
                    │  server.ts   │  POST /app/api/analyze
                    │              │  POST /app/api/execute
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌───────────┐ ┌──────────┐ ┌──────────────┐
       │Dashboard  │ │Intelligence│ │  Portfolio   │
       │(feed)     │ │Panel      │ │  (wallet)    │
       │           │ │           │ │              │
       │Signals    │ │Risk pulse │ │On-chain      │
       │filtered   │ │Alerts     │ │balances via   │
       │by interest│ │Top movers │ │viem RPC      │
       └───────────┘ └──────────┘ └──────────────┘
```

### Key Files

| File | Role |
|---|---|
| `src/lib/market-ingestion.ts` | Fetches live data from CoinGecko, DefiLlama, SoSoValue |
| `src/lib/risk-engine.ts` | Multi-factor risk score calculation (0-100) |
| `src/lib/analysis-engine.ts` | Data-driven narrative synthesis |
| `src/lib/recommendation-engine.ts` | Generates primary/defensive/opportunity actions |
| `src/lib/signals/` | 4 signal generators (ETF, liquidity, macro, risk) |
| `src/lib/intelligence-engine.ts` | Orchestrates snapshot composition |
| `src/lib/sentinel-store.ts` | Persistence (Workers KV / in-memory) |
| `src/lib/execution-engine.ts` | Trade execution dispatch → DEX clients |
| `src/server.ts` | Cloudflare Workers entry + API route handler |

---

## AI Flow

Sentinel's "AI" is a deterministic multi-factor inference engine — no LLM latency, no hallucination, no API cost. Every decision traces back to observable data:

```
1. INGEST
   CoinGecko → BTC $X, ETH $Y, 24h changes
   DefiLlama → TVL, stablecoin market cap
   SoSoValue → ETF flow %, macro events, narrative (if API key valid)
   ↓

2. SIGNAL GENERATION
   4 signal generators run in parallel:
   • ETF outflows > 12% → HIGH severity signal
   • Liquidity change > 120% → rotation signal
   • Macro events present → volatility warning
   • Unlock pressure > 70 → supply risk
   ↓

3. RISK SCORING
   scoreRisk() weights 4 factors:
   ETF Stress (30%) + Macro (25%) + Liquidity/Vol (25%) + Signal Density (20%)
   → Unified 0-100 score → LOW / MEDIUM / HIGH / CRITICAL
   ↓

4. ANALYSIS SYNTHESIS
   buildAnalysis() examines context:
   • Is BTC weak AND ETF stressed? → "Systemic pressure"
   • Is DXY strong? → "Macro headwind"
   • Otherwise → market regime from context
   ↓

5. RECOMMENDATIONS
   buildRecommendations() maps risk level to actions:
   • HIGH → "De-risk: reduce leverage, tighten stops"
   • MODERATE → "Hedged rotation: maintain core, trim margin"
   • LOW → "Opportunistic: increase high-conviction exposure"
   ↓

6. COMPOSE & SERVE
   composeSnapshot() assembles everything into a MarketSnapshot
   → Persisted to KV store
   → Served at GET /app/api/market
   → Polled by client every 30s
```

---

## SoSoValue Integration

SoSoValue provides BTC ETF flow data and market narrative — a key signal for institutional sentiment.

**Integration points:**
- `fetchSoSoValueContext()` at `src/lib/market-ingestion.ts:156`
- Tries 3 endpoint paths: `/etf/flow/btc`, `/market/overview`, and base URL
- Falls back gracefully to BTC-price-derived proxy estimates when API unavailable
- Extracted fields: `narrative`, `macroEvents`, `etfOutflowPct`, `rotationTheme`

**To activate live ETF data:**
1. Register at [SoSoValue](https://www.sosovalue.com/) (API Open Platform)
2. Generate an API key
3. Set `SOSOVALUE_API_KEY` in `.env`

Without a valid key, the system uses `btcChange` as a proxy for ETF outflow sentiment — a known limitation documented in the source.

---

## SoDEX Integration

Sentinel routes trade execution through a pluggable DEX client architecture:

```
Execution Request
  │
  ▼
execution-engine.ts
  │
  ▼
dex-client.ts ──► Auto-detects available providers:
  │                  1. Jupiter (Solana, V6 Quote API)
  │                  2. SoDEX (testnet, via env config)
  │                  3. Mock client (demo mode)
  │
  ▼
Execution Response
  ─ transactionId, route, slippageBps, estimatedFeesUsd, expectedOutputAmount
```

- **Jupiter client** (`dex-jupiter.ts`): Real Solana DEX aggregator — fetches quotes via `https://quote-api.jup.ag/v6/quote`, constructs swap transactions
- **SoDEX client** (`dex-sodex.ts`): Testnet execution via `VITE_SODEX_API_URL` + `VITE_SODEX_API_KEY`
- **Mock client** (`dex-mock-client.ts`): Simulated execution for demo/trading

---

## Features

###  AI Intelligence Feed
Live signals ranked by impact and confidence, filtered by your interest profile. Each signal includes: category, title, explanation, impact level, confidence score, and suggested actions.

###  Market Alerts
Real-time push notifications for: ETF outflow spikes, macro event windows, liquidity rotation, token unlock pressure. Alerts persist across sessions via KV store.

###  Explanations
Every data point includes reasoning — not just "BTC is down 2%" but *why*: "ETF outflows at 14.2% indicate cooling institutional demand, historically a leading indicator for local tops."

###  Risk Engine
Four-factor weighted scoring: ETF stress (30%), macro catalysts (25%), liquidity & volatility (25%), signal density (20%) → unified 0-100 score with breakdown.

###  One-Click Execution
From signal to swap in a single click. Routes through the best available DEX provider. Preview includes slippage, fees, and expected output before submission.

###  Live Wallet Portfolio
On-chain balance fetching for Ethereum (ETH + ERC20s: USDC, USDT, WBTC, DAI, LINK, UNI, AAVE) and Solana (SOL). PnL computed from actual price changes, not estimates.

###  Guest Demo Mode
No wallet? No problem. Click "Continue as Guest" to explore the full product immediately.

---

## Demo

**Try it now:**

1. Clone the repo
2. `cd sentinel-app && npm install && cp .env.example .env`
3. `npm run dev`
4. Open `http://localhost:5173`
5. Click **"Continue as Guest"** to skip auth
6. Explore the Dashboard, Intelligence Panel, Portfolio, and Risk Engine

**What you'll see:**
- Live prices streaming from CoinGecko (BTC, ETH, SOL, FET, ONDO, DXY)
- Risk score with breakdown and suggested action
- AI-curated intelligence feed with signals ranked by impact
- Portfolio page with equity curve, sector exposure, holdings table
- Wallet balances fetched live from Ethereum RPC (when connected)
- Data source provenance showing live vs. fallback indicators

---

## Setup

```bash
# Prerequisites
node >= 18
npm

# Install
cd sentinel-app
npm install

# Configure
cp .env.example .env
# Required: VITE_PRIVY_APP_ID (from https://dashboard.privy.io)
# Optional: SOSOVALUE_API_KEY (from https://www.sosovalue.com)
# Optional: VITE_SODEX_API_URL, VITE_SODEX_API_KEY

# Start development
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_PRIVY_APP_ID` | Yes | Privy app ID for authentication |
| `SOSOVALUE_API_KEY` | No* | SoSoValue API key for live BTC ETF flow data |
| `VITE_SODEX_API_URL` | No | SoDEX execution endpoint |
| `VITE_SODEX_API_KEY` | No | SoDEX API key |
| `VITE_ETH_RPC_URL` | No | Ethereum RPC (default: public node) |
| `VITE_SOL_RPC_URL` | No | Solana RPC (default: public node) |

\* Without `SOSOVALUE_API_KEY` the system falls back to BTC-price-based proxy estimates for ETF flow data.

---

## Future Vision

### Wave 2 (Next)

- **AI Trading Copilot**: Natural-language strategy builder — "alert me when ETH/BTC ratio crosses 0.05 with volume > $1B"
- **Telegram Alerts**: Push notifications to Telegram for critical signals
- **Social Sentiment**: Cross-reference on-chain data with social sentiment indices
- **Backtesting Engine**: Test strategies against historical market data

### Wave 3 (Long-term)

- **Autonomous Treasury Management Agent**: Deploy capital according to risk score thresholds automatically
- **Institutional-Grade Risk Monitoring**: Multi-wallet portfolio tracking, exposure limits, compliance reporting
- **On-Chain Infrastructure**: Smart contract-based execution with verifiable settlement
- **Custom Risk Models**: User-configurable factor weights and signal thresholds

### Business Trajectory

```
Solo trader tool  ──►  AI trading copilot  ──►  Institutional risk infrastructure

     Wave 1                Wave 2                      Wave 3
```

Sentinel's architecture is designed to scale from a solo trader's intelligence terminal to an institutional-grade risk monitoring and execution platform. The core loop — data ingestion → risk scoring → analysis → execution — is the same at every scale. Only the surface area expands.

**Addressable markets:**
- **Wave 1**: Retail crypto traders (50M+ active on-chain traders)
- **Wave 2**: Telegram-integrated trading communities and DAO treasuries
- **Wave 3**: Crypto funds, market makers, and centralized exchange risk teams

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, TanStack Router, Tailwind CSS, Framer Motion, Recharts |
| Authentication | Privy (email, wallet, Google OAuth) |
| Backend | Cloudflare Workers + Hono SSR |
| Data Sources | CoinGecko API, DefiLlama API, SoSoValue API |
| Execution | Jupiter V6 (Solana), SoDEX API, Mock Client |
| Wallet Balances | viem (Ethereum RPC), Solana JSON-RPC |
| Persistence | Cloudflare KV, in-memory fallback |
| Containerization | Docker + Nginx (dev) |
