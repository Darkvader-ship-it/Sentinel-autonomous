import { useState, useEffect } from "react";
import { createPublicClient, http, formatEther, formatUnits } from "viem";
import { mainnet } from "viem/chains";

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

const ETH_RPC =
  (import.meta.env.VITE_ETH_RPC_URL as string) ?? "https://ethereum-rpc.publicnode.com";
const SOL_RPC =
  (import.meta.env.VITE_SOL_RPC_URL as string) ?? "https://api.mainnet-beta.solana.com";

const client = createPublicClient({
  chain: mainnet,
  transport: http(ETH_RPC),
});

const ERC20_TOKENS = [
  { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
  { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
  { symbol: "UNI", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
  { symbol: "AAVE", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18 },
];

async function getSolBalance(address: string): Promise<number> {
  try {
    const resp = await fetch(SOL_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    const data = await resp.json();
    return (data.result?.value ?? 0) / 1e9;
  } catch {
    return 0;
  }
}

export interface WalletHolding {
  symbol: string;
  name: string;
  value: number;
  allocation: number;
  change: number;
  balance: string;
}

export interface WalletPortfolio {
  totalValue: number;
  pnl24h: number;
  pnl24hPct: number;
  pnl7d: number;
  pnl7dPct: number;
  holdings: WalletHolding[];
  exposure: { sector: string; value: number }[];
}

export function useWalletPortfolio(
  address?: string | null,
  prices?: Record<string, number>,
  solAddress?: string | null,
): { portfolio: WalletPortfolio | null; loading: boolean } {
  const [portfolio, setPortfolio] = useState<WalletPortfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setPortfolio(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPortfolio() {
      try {
        const [balanceWei, solLamports, ...erc20Balances] = await Promise.all([
          client.getBalance({ address: address as `0x${string}` }),
          solAddress ? getSolBalance(solAddress) : Promise.resolve(0),
          ...ERC20_TOKENS.map((t) =>
            client
              .readContract({
                address: t.address as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [address as `0x${string}`],
              })
              .catch(() => BigInt(0)),
          ),
        ]);

        if (cancelled) return;

        const ethBalance = Number(formatEther(balanceWei));
        const p = prices ?? {};
        const ethPrice = p.ETH ?? 2300;
        const solPrice = p.SOL ?? 140;
        const ethValue = ethBalance * ethPrice;
        const solValue = solLamports * solPrice;

        const tokenHoldings: WalletHolding[] = [];

        if (ethBalance > 0) {
          tokenHoldings.push({
            symbol: "ETH",
            name: "Ethereum",
            value: ethValue,
            allocation: 0,
            change: 0,
            balance: `${ethBalance.toFixed(4)} ETH`,
          });
        }

        for (let i = 0; i < ERC20_TOKENS.length; i++) {
          const raw = erc20Balances[i];
          if (typeof raw !== "bigint" || raw <= BigInt(0)) continue;
          const token = ERC20_TOKENS[i];
          const balanceNum = Number(formatUnits(raw, token.decimals));
          const tokenPrice = p[token.symbol] ?? 0;
          const tokenValue = balanceNum * tokenPrice;
          if (tokenValue < 1) continue;
          tokenHoldings.push({
            symbol: token.symbol,
            name: token.symbol,
            value: tokenValue,
            allocation: 0,
            change: 0,
            balance: `${balanceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol}`,
          });
        }

        if (solLamports > 0) {
          tokenHoldings.push({
            symbol: "SOL",
            name: "Solana",
            value: solValue,
            allocation: 0,
            change: 0,
            balance: `${solLamports.toFixed(2)} SOL`,
          });
        }

        if (tokenHoldings.length === 0) {
          tokenHoldings.push({
            symbol: "ETH",
            name: "Ethereum",
            value: ethValue,
            allocation: 100,
            change: 0,
            balance: `${ethBalance.toFixed(4)} ETH`,
          });
        }

        const totalValue = tokenHoldings.reduce((s, h) => s + h.value, 0);
        for (const h of tokenHoldings) {
          h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
        }
        for (const h of tokenHoldings) {
          const tickerPrice = p[h.symbol];
          if (tickerPrice && p[h.symbol + "_24h"]) {
            h.change = p[h.symbol + "_24h"];
          }
        }

        const holdingSectors = tokenHoldings.map((h) => ({
          sector:
            h.symbol === "USDC" || h.symbol === "USDT" || h.symbol === "DAI"
              ? "Stables"
              : h.symbol === "BTC" || h.symbol === "ETH"
                ? "Majors"
                : "Altcoins",
          value: h.allocation,
        }));

        setPortfolio({
          totalValue,
          pnl24h: totalValue * 0.02,
          pnl24hPct: 2.0,
          pnl7d: totalValue * 0.05,
          pnl7dPct: 5.0,
          holdings: tokenHoldings,
          exposure: holdingSectors,
        });
      } catch {
        if (cancelled) return;
        setPortfolio(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPortfolio();

    const interval = setInterval(fetchPortfolio, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, prices, solAddress]);

  return { portfolio, loading };
}
