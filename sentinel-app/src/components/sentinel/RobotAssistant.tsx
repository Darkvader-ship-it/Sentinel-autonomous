import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";
import botImg from "@/assets/sentinel-bot.png";

const suggestions = [
  "Is this real data?",
  "What is Sentinel?",
  "What makes Sentinel different?",
  "What is an ETF outflow?",
  "How do I execute a trade?",
];

const replies: Record<string, string> = {
  "Is this real data?":
    "Sentinel runs in Demo Mode for evaluation. CoinGecko prices are live if their API responds; ETF flow data from SoSoValue and DEX execution are simulated with realistic synthetic data. Every simulated source is labeled '(Demo Mode)' in the Data Sources panel. Set real API keys in .env to activate live data across all pipelines — the architecture handles real and fallback sources identically.",
  "What is Sentinel?":
    "Sentinel is your autonomous market analyst. I watch ETF flows, macro news, and on-chain activity 24/7, then translate them into plain-English actions. Think of me as a hedge-fund desk that sits in your pocket.",
  "What makes Sentinel different?":
    "Most crypto tools just show data — prices, charts, TVL. Sentinel goes further: it tells you what happened, why it matters for YOUR portfolio, what you should do about it, and lets you execute in one click. It replaces 6 separate tools with a single intelligence terminal. The edge is the analysis engine: multi-factor risk scoring, causal narrative synthesis, and SoDEX execution — all in one place.",
  "What is an ETF outflow?":
    "An ETF outflow means more investors are selling shares of an exchange-traded fund than buying. For BTC ETFs, large outflows often signal institutions reducing exposure, which historically pulls spot prices lower in the short term.",
  "How do I execute a trade?":
    "When you see a card with an [Execute] button, click it. A modal opens showing the route, slippage, and expected outcome through SoDEX. Confirm — and the trade fires. No CEX needed.",
  "What does 'risk score' mean?":
    "Risk score (0-100) is my real-time read on how dangerous markets are right now. Below 30: calm. 30-60: normal. 60-80: elevated — be cautious. Above 80: storm — consider hedging or moving to stables. The score is built from 4 factors: ETF stress (30%), macro catalysts (25%), liquidity & volatility (25%), and signal density (20%).",
};

export function RobotAssistant() {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<{ role: "bot" | "user"; text: string }[]>([
    {
      role: "bot",
      text: "Hi — I'm Sentinel. New to all this? Pick a question below or ask me anything.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const reply =
      replies[text] ??
      "Great question. I’d normally tap the live market snapshot, stored profile, and analysis layer here. Try one of the suggested questions to see my reasoning.";
    setThread((t) => [...t, { role: "user", text }, { role: "bot", text: reply }]);
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 md:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl glass-strong shadow-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/40 blur-md" />
                  <img src={botImg} alt="" className="relative h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Sentinel Bot</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
                    Beginner-friendly mode
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-3">
              {thread.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-elevated text-foreground/90 border border-border/60"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 px-3 py-2">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything…"
                  className="flex-1 rounded-md border border-border bg-surface/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-4 md:right-6 z-50 group"
        aria-label="Open Sentinel assistant"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl group-hover:bg-primary/60 transition" />
          <div className="relative flex items-center gap-2 rounded-full border border-primary/40 bg-surface-elevated/90 backdrop-blur pl-2 pr-4 py-2 shadow-elevated">
            <img src={botImg} alt="" className="h-10 w-10 animate-float" />
            <div className="text-left">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Ask Sentinel
              </div>
              <div className="text-xs font-medium text-foreground">Need help?</div>
            </div>
          </div>
        </div>
      </button>
    </>
  );
}
