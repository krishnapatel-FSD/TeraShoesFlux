import { existsSync } from "node:fs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Always defined, so the bundler inlines it and drops the motion probe (src/motion/probe.ts) from
  // production builds unless `pnpm test:motion` builds with it set to "1".
  env: {
    NEXT_PUBLIC_MOTION_PROBE: process.env.NEXT_PUBLIC_MOTION_PROBE ?? "",
    // B5: the hero's runner loads only when `pnpm assets:character` has made its file (A8).
    // Restart the dev server after adding it. `pnpm test:motion` points this at the test dummy.
    NEXT_PUBLIC_HERO_CHARACTER:
      process.env.NEXT_PUBLIC_HERO_CHARACTER ??
      (existsSync("public/3d/character/character.glb")
        ? "/3d/character/character.glb"
        : ""),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
