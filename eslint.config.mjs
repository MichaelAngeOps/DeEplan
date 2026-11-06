import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Fichiers de maquette : runtime de prototypage tiers, pas du code applicatif (prompt §6)
    "maquette/**",
    // Coquille Electron en CommonJS, hors code applicatif Next.js.
    "desktop/**",
  ]),
]);
