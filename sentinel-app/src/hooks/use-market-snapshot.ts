import { useEffect, useRef, useState, useCallback } from "react";
import type { MarketSnapshot } from "@/lib/intelligence-engine";

function sendAlertNotification(alert: { title: string; severity: string }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(`Sentinel · ${alert.severity}`, {
    body: alert.title,
    icon: "/favicon.ico",
  });
}

export function useMarketSnapshot(refreshIntervalMs = 30_000, monitoring?: string) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenAlerts = useRef(new Set<string>());

  const handleSnapshot = useCallback((data: MarketSnapshot) => {
    setSnapshot(data);
    for (const alert of data.alerts) {
      if (!seenAlerts.current.has(alert.id)) {
        seenAlerts.current.add(alert.id);
        sendAlertNotification(alert);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSnapshot() {
      try {
        const response = await fetch("/app/api/market?refresh=1", {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as MarketSnapshot;
        handleSnapshot(data);
      } catch {
        // keep prior snapshot or null
      } finally {
        setLoading(false);
      }
    }

    if (monitoring === "Off") {
      setLoading(false);
      return;
    }

    loadSnapshot();

    const active = monitoring !== "Paused" && refreshIntervalMs > 0;
    if (active) {
      intervalRef.current = setInterval(loadSnapshot, refreshIntervalMs);
    }

    return () => {
      controller.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshIntervalMs, monitoring, handleSnapshot]);

  return { snapshot, loading, setSnapshot };
}
