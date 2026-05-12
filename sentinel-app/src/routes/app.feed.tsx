import { createFileRoute } from "@tanstack/react-router";
import { SignalCard } from "@/components/sentinel/SignalCard";
import { feedItems as fallbackFeedItems } from "@/lib/mock-data";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";

export const Route = createFileRoute("/app/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { snapshot } = useMarketSnapshot();
  const items = snapshot?.feedItems.length
    ? snapshot.feedItems
    : fallbackFeedItems;

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-1">Market Feed</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Live stream of every event Sentinel detects across markets.
      </p>
      <div className="space-y-4">
        {items.map((item, i) => (
          <SignalCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
