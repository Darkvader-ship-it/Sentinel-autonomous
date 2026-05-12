const CHANNEL_MAP: Record<string, { push: boolean; email: boolean }> = {
  "In-app": { push: false, email: false },
  "In-app + Email": { push: false, email: true },
  "In-app + Push": { push: true, email: false },
  "All channels": { push: true, email: true },
};

async function requestBrowserPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function useNotifications() {
  const notify = async (channel: string, title: string, body: string) => {
    const config = CHANNEL_MAP[channel];
    if (!config || !config.push) return;

    const granted = await requestBrowserPermission();
    if (!granted) return;

    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  };

  return { notify };
}
