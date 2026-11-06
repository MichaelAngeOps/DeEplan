import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Évite que `next dev` génère un AGENTS.md dans le dépôt.
  agentRules: false,
};

export default nextConfig;
