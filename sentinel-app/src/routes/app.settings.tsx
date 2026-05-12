import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/lib/auth";

type SettingKey = "risk" | "interests" | "monitoring" | "notifications" | "wallet";

function walletChoices(userWallet: string | null | undefined): string[] {
  return userWallet ? [userWallet] : ["No wallet connected"];
}

const OPTIONS: Omit<Record<SettingKey, { label: string; choices: string[] }>, "wallet"> & {
  wallet: { label: string; choices: (wallet: string | null | undefined) => string[] };
} = {
  risk: { label: "Risk Profile", choices: ["Conservative", "Moderate", "Aggressive"] },
  interests: {
    label: "Interests",
    choices: ["BTC", "ETH", "SOL", "AI", "DeFi", "Memecoins", "RWA", "L2s"],
  },
  monitoring: { label: "Real-time AI Monitoring", choices: ["Enabled", "Paused", "Off"] },
  notifications: {
    label: "Notification Channel",
    choices: ["In-app", "In-app + Email", "In-app + Push", "All channels"],
  },
  wallet: { label: "Connected Wallet", choices: walletChoices },
};

const MULTI: Record<SettingKey, boolean> = {
  risk: false,
  interests: true,
  monitoring: false,
  notifications: false,
  wallet: false,
};

function Route_Component() {
  const { user } = useAuth();
  const { snapshot, setSnapshot } = useMarketSnapshot();
  const { notify } = useNotifications();
  const defaultWallet = user?.wallet ?? "Disconnected";
  const [values, setValues] = useState<Record<SettingKey, string[]>>({
    risk: ["Moderate"],
    interests: ["BTC", "ETH", "AI", "DeFi", "SOL"],
    monitoring: ["Enabled"],
    notifications: ["In-app + Email"],
    wallet: [defaultWallet],
  });

  useEffect(() => {
    if (!snapshot?.profile) return;
    setValues({
      risk: [snapshot.profile.riskProfile],
      interests: snapshot.profile.interests,
      monitoring: [snapshot.profile.monitoring],
      notifications: [snapshot.profile.notifications],
      wallet: [snapshot.profile.wallet],
    });
  }, [snapshot]);

  const toggle = (key: SettingKey, choice: string) => {
    setValues((prev) => {
      const current = prev[key];
      if (MULTI[key]) {
        return {
          ...prev,
          [key]: current.includes(choice)
            ? current.filter((c) => c !== choice)
            : [...current, choice],
        };
      }
      return { ...prev, [key]: [choice] };
    });
  };

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/app/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          riskProfile: values.risk[0],
          interests: values.interests,
          monitoring: values.monitoring[0],
          notifications: values.notifications[0],
          wallet: values.wallet[0],
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const refresh = await fetch("/app/api/market?refresh=1");
      if (!refresh.ok) throw new Error("Snapshot refresh failed");
      const data = await refresh.json();
      setSnapshot(data);

      toast.success("Profile saved — changes applied");
      notify(values.notifications[0], "Sentinel", "Settings applied — monitoring is active.");
    } catch (e) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground mb-6">
        Personalize Sentinel's monitoring, risk profile, and notifications.
      </p>

      <div className="mb-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>

      <div className="space-y-4">
        {(Object.keys(OPTIONS) as SettingKey[]).map((key) => {
          const opt = OPTIONS[key];
          const choices = typeof opt.choices === "function" ? opt.choices(user?.wallet) : opt.choices;
          const selected = values[key];
          return (
            <div key={key} className="rounded-lg border border-border bg-card px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground">
                  {MULTI[key] ? "Select multiple" : "Select one"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {choices.map((choice) => {
                  const active = selected.includes(choice);
                  return (
                    <button
                      key={choice}
                      onClick={() => toggle(key, choice)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none",
                        active
                          ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/40"
                          : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                      )}
                    >
                      {key === "wallet" && choice.startsWith("0x") ? (
                        <Wallet className="h-3 w-3" />
                      ) : active ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                      {key === "wallet" && choice.startsWith("0x")
                        ? `${choice.slice(0, 6)}...${choice.slice(-4)}`
                        : choice}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/settings")({
  component: Route_Component,
});
