import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Vitest config (design §22). Unit + integration tests run with NO network and
 * NO live credentials — Airtable/auth are always mocked at the single boundary.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` is resolved by Next's webpack at build time via its
      // bundled copy; map it to an empty module so the DAL's `import 'server-only'`
      // guard loads cleanly under Vitest (no network, no build pipeline).
      "server-only": fileURLToPath(
        new URL(
          "./node_modules/next/dist/compiled/server-only/empty.js",
          import.meta.url,
        ),
      ),
    },
  },
});
