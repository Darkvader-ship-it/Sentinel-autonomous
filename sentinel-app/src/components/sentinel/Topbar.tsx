import { Wallet, LogOut, Bell, Activity } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { tickers as fallbackTickers } from "@/lib/mock-data";

const MONITORING_STYLES: Record<string, string> = {
  Enabled: "bg-success/10 text-success border-success/30",
  Paused: "bg-warning/10 text-warning border-warning/30",
  Off: "bg-muted/10 text-muted-foreground border-border",
};

export function Topbar({
  wallet,
  email,
  onSignOut,
  isGuest,
}: {
  wallet?: string | null;
  email?: string;
  onSignOut?: () => void | Promise<void>;
  isGuest?: boolean;
}) {
  const { snapshot } = useMarketSnapshot();
  const tickers = snapshot?.tickers ?? fallbackTickers;
  const riskLabel = snapshot?.risk.level ?? "MEDIUM";
  const monitoring = snapshot?.profile?.monitoring ?? "Enabled";
  const notifications = snapshot?.profile?.notifications ?? "In-app";
  const dataLive = snapshot?.sourceStack?.some(
    (s) => s.role === "primary" && s.note.toLowerCase().includes("live"),
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-6 px-4 md:px-6">
        <div className="hidden lg:flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${dataLive ? "bg-success" : "bg-warning"} animate-pulse-dot`}
          />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {dataLive ? "Live Data" : "Fallback Data"}
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-none">
          {tickers.map((t) => (
            <div key={t.symbol} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-medium text-muted-foreground">{t.symbol}</span>
              <span className="font-mono text-sm text-foreground">${t.price.toLocaleString()}</span>
              <span className={`font-mono text-xs ${t.change >= 0 ? "ticker-up" : "ticker-down"}`}>
                {t.change >= 0 ? "+" : ""}
                {t.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div
            className={`hidden md:flex items-center gap-1.5 rounded-md border px-2 py-1 ${MONITORING_STYLES[monitoring] ?? MONITORING_STYLES.Enabled}`}
          >
            <Activity className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider">{monitoring}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1">
            <Bell className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {notifications}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-2.5 py-1">
            <span className="text-[10px] uppercase tracking-wider text-warning/80">
              Global Risk
            </span>
            <span className="font-mono text-xs font-semibold text-warning">{riskLabel}</span>
          </div>
          {isGuest && (
            <div className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Demo</span>
            </div>
          )}
          <button className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition">
            <Wallet className="h-3.5 w-3.5" />
            <span className="font-mono">
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : email}
            </span>
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-destructive/10 hover:text-destructive transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
