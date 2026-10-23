import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Always defined, so the bundler inlines it and drops the motion probe (src/motion/probe.ts) from
  // production builds unless `pnpm test:motion` builds with it set to "1".
  env: {
    NEXT_PUBLIC_MOTION_PROBE: process.env.NEXT_PUBLIC_MOTION_PROBE ?? "",
    // The hero shows a still athlete (public/hero/athlete.webp). Set this to
    // "/3d/character/character.glb" (`pnpm assets:character`, A8) for the animated 3D player (B5)
    // instead, and restart the dev server. `pnpm test:motion` sets it to test the 3D player.
    NEXT_PUBLIC_HERO_CHARACTER: process.env.NEXT_PUBLIC_HERO_CHARACTER ?? "",
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
