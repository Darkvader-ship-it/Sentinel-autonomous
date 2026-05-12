import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { SignalCard } from "@/components/sentinel/SignalCard";
import { Brain, Activity } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { feedItems as fallbackFeedItems } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function matchesInterest(item: { title: string; category: string }, interests: string[]): boolean {
  const text = `${item.title} ${item.category}`.toLowerCase();
  return interests.some((i) => text.includes(i.toLowerCase()));
}

function Dashboard() {
  const { user } = useAuth();
  const interests = user?.onboardingComplete ? (useAuth() as any).interests : null;
  const monitoring = user?.onboardingComplete ? (useAuth() as any).monitoring : "Enabled";
  const { snapshot } = useMarketSnapshot(30_000, monitoring);
  const feed = snapshot?.feedItems ?? fallbackFeedItems;
  const profile = snapshot?.profile;

  const userInterests = profile?.interests ?? ["BTC", "ETH", "AI", "DeFi", "SOL"];
  const filteredFeed = useMemo(
    () => feed.filter((item) => matchesInterest(item, userInterests)),
    [feed, userInterests],
  );

  const onFallbackData = snapshot?.sourceStack?.every(
    (s) => !s.note.toLowerCase().includes("live"),
  );

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      {onFallbackData && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
          <Activity className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs text-warning/90">
            Using simulated data — live API sources unavailable. Check Data Sources panel for details.
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary mb-1">
            <Brain className="h-3.5 w-3.5" />
            Intelligence Feed
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">What matters right now</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated by Sentinel — ranked by impact, confidence, and your risk profile.
          </p>
          {filteredFeed.length < feed.length && (
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {filteredFeed.length} of {feed.length} signals matching your interests
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredFeed.map((item, i) => (
          <SignalCard key={item.id} item={item} index={i} />
        ))}
        {filteredFeed.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No signals match your selected interests. Update your interests in Settings.
          </p>
        )}
      </div>
    </div>
  );
}
