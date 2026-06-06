export interface SentimentMention {
  symbol: string;
  mentionCount: number;
  sentiment: number;
  change24h: number;
  source: string;
}

export interface SentimentSnapshot {
  overall: number;
  mentions: SentimentMention[];
  trending: string[];
  fetchedAt: string;
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

export function fetchSocialSentiment(
  tickers: Array<{ symbol: string; price: number; change24h: number }>,
): SentimentSnapshot {
  const mentionSources = ["Twitter/X", "Reddit", "Discord", "Telegram"];

  const mentions: SentimentMention[] = tickers
    .filter((t) => ["BTC", "ETH", "SOL", "FET", "ONDO"].includes(t.symbol))
    .map((t) => ({
      symbol: t.symbol,
      mentionCount: Math.floor(randomBetween(200, 15000)),
      sentiment: randomBetween(-1, 1),
      change24h: randomBetween(-15, 25),
      source: mentionSources[Math.floor(Math.random() * mentionSources.length)],
    }));

  const totalSentiment = mentions.reduce((s, m) => s + m.sentiment * m.mentionCount, 0);
  const totalMentions = mentions.reduce((s, m) => s + m.mentionCount, 0);
  const overall = totalMentions > 0 ? totalSentiment / totalMentions : 0;

  const sorted = [...mentions].sort((a, b) => b.change24h - a.change24h);
  const trending = sorted.slice(0, 3).map((m) => m.symbol);

  return {
    overall: Math.round(overall * 100) / 100,
    mentions,
    trending,
    fetchedAt: new Date().toISOString(),
  };
}
