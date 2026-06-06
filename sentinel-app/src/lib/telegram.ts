export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

const STORAGE_KEY = "sentinel:telegram";

function readConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TelegramConfig;
  } catch {}
  return { botToken: "", chatId: "", enabled: false };
}

function writeConfig(config: TelegramConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function getTelegramConfig(): TelegramConfig {
  return readConfig();
}

export function setTelegramConfig(config: TelegramConfig): void {
  writeConfig(config);
}

export async function sendTelegramAlert(message: string): Promise<boolean> {
  const config = readConfig();
  if (!config.botToken || !config.chatId || !config.enabled) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: `🤖 *Sentinel Alert*\n\n${message}`,
        parse_mode: "Markdown",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function testTelegramConnection(
  botToken: string,
  chatId: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Sentinel: Telegram alerts connected successfully!",
        parse_mode: "Markdown",
      }),
    });
    if (res.ok) return { ok: true, message: "Test message sent successfully!" };
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.description ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
