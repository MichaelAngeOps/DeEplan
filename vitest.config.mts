import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // Le démarrage du Postgres temporaire prend quelques secondes.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
