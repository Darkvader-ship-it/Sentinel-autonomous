// Sentinel Vite config — TanStack Start with Vercel deployment target.
// Cloudflare Workers plugin is disabled; Vercel handles SSR via api/index.ts.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
});
