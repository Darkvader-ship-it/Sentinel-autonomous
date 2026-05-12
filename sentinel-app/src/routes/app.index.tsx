import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType } from "react";
import { SignalCard } from "@/components/sentinel/SignalCard";
import { Brain, Activity, Sparkles, Radio, Waves, TrendingUp, Shield, Eye } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { feedItems as fallbackFeedItems } from "@/lib/mock-data";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function matchesInterest(item: { title: string; category: string }, interests: string[]): boolean {
  const text = `${item.title} ${item.category}`.toLowerCase();
  return interests.some((i) => text.includes(i.toLowerCase()));
}

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "MARKET EVENT": TrendingUp,
  "MACRO SIGNAL": Shield,
  "LIQUIDITY SHIFT": Waves,
  "TOKEN UNLOCK": Eye,
  "ON-CHAIN": Radio,
};

const SOURCE_LABELS: Record<string, string> = {
  CoinGecko: "Prices",
  DefiLlama: "Liquidity",
  SoSoValue: "ETF Flows",
  Sentinel: "Risk Factors",
};

type SourceStatus = { label: string; source: string; live: boolean };

function Dashboard() {
  const { snapshot, loading } = useMarketSnapshot(30_000);
  const feed = snapshot?.feedItems ?? fallbackFeedItems;
  const profile = snapshot?.profile;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const userInterests = profile?.interests ?? ["BTC", "ETH", "AI", "DeFi", "SOL"];
  
  const monitoringSources: SourceStatus[] = useMemo(() => {
    if (!snapshot?.sourceStack) {
      return [
        { label: "Prices", source: "CoinGecko", live: false },
        { label: "Liquidity", source: "DefiLlama", live: false },
        { label: "ETF Flows", source: "SoSoValue", live: false },
        { label: "Risk Factors", source: "Sentinel", live: true },
      ];
    }
    return snapshot.sourceStack.map(s => ({
      label: SOURCE_LABELS[s.name] ?? s.name,
      source: s.name,
      live: s.note.toLowerCase().includes("live"),
    }));
  }, [snapshot?.sourceStack]);

  const hasLive = monitoringSources.some(s => s.live);
  const categories = useMemo(() => {
    const set = new Set(feed.map((f) => f.category));
    return Array.from(set);
  }, [feed]);

  const filteredFeed = useMemo(() => {
    let items = feed.filter((item) => matchesInterest(item, userInterests));
    if (activeCategory) {
      items = items.filter((i) => i.category === activeCategory);
    }
    return items;
  }, [feed, userInterests, activeCategory]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      {/* Sentinel Status Bar — live from sourceStack */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-display text-sm font-semibold text-foreground">
              Sentinel is monitoring
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {feed.length} signals · {monitoringSources.length} data sources
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Auto-refreshing</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {monitoringSources.map((item) => (
            <div
              key={item.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono ${
                item.live
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-warning/5 text-warning border border-warning/20"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${item.live ? "bg-success" : "bg-warning"}`} />
              {item.label}
              <span className="opacity-60">· {item.source}</span>
            </div>
          ))}
        </div>
        {!hasLive && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning/80">
            <Activity className="h-3 w-3" />
            Demo Mode — data is simulated for evaluation. Connect API keys via `.env` for live data.
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-1">
            <Brain className="h-3.5 w-3.5" />
            Intelligence Feed
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">What matters right now</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated by Sentinel — ranked by impact, confidence, and your risk profile.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-border/60 bg-surface/50 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {filteredFeed.length} signals · avg conf{" "}
            {filteredFeed.length > 0
              ? Math.round(filteredFeed.reduce((s, f) => s + f.confidence, 0) / filteredFeed.length)
              : 0}
            %
          </span>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition ${
              !activeCategory
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition ${
                  cat === activeCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {cat}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        {loading && feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative flex h-12 w-12 items-center justify-center mb-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Sentinel is analyzing the markets…</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Scanning ETF flows, macro events, liquidity shifts, and on-chain data
            </p>
          </div>
        ) : (
          filteredFeed.map((item, i) => (
            <SignalCard key={item.id} item={item} index={i} />
          ))
        )}
        {!loading && filteredFeed.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No signals match your selected interests. Update your interests in Settings.
          </p>
        )}
      </div>
    </div>
  );
}
