import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Le lint est un gate séparé (`npm run lint`, cf. CI/local) et ne doit pas
    // faire partie du build de production : plus rapide, et évite les soucis
    // d'outillage ESLint pendant `next build` sur Vercel (postinstall
    // `unrs-resolver`). Les erreurs TypeScript, elles, font toujours échouer le
    // build (comportement Next par défaut, conservé).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
