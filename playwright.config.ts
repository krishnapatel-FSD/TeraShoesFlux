import { defineConfig, devices } from "@playwright/test";

const port = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Each page renders WebGL on the CPU (SwiftShader), which uses every core: one test at a time
  // keeps results independent of machine load.
  workers: 1,
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // On CI this points at the branch's Vercel preview; locally it uses the dev server.
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${port}`,
    trace: "on-first-retry",
    // Headless Chromium has no GPU; SwiftShader gives it software WebGL so the 3D scene runs.
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  expect: { timeout: 15_000 },
  projects: [
    // motion.spec.ts runs only in the "motion" project below (reduced-motion.spec.ts runs here).
    {
      name: "desktop",
      testIgnore: /(^|[\\/])motion\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "phone",
      testIgnore: /(^|[\\/])motion\.spec\.ts$/,
      use: { ...devices["Pixel 7"] },
    },
    // Motion timings (`pnpm test:motion`): a production build on the real GPU, since software
    // WebGL draws a few frames a second and GSAP then stretches every animation.
    ...(process.env.MOTION
      ? [
          {
            name: "motion",
            testMatch: /(^|[\\/])motion\.spec\.ts$/,
            use: {
              ...devices["Desktop Chrome"],
              launchOptions: {
                args: [
                  "--use-angle=d3d11",
                  "--enable-gpu",
                  "--ignore-gpu-blocklist",
                ],
              },
            },
          },
        ]
      : []),
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        port,
        reuseExistingServer: !process.env.CI,
      },
});
