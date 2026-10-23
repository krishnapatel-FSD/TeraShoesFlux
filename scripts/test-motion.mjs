// `pnpm test:motion`: the Workstream B timing checks (e2e/motion.spec.ts) against a production build
// with the motion probe compiled in, in Chrome on this machine's GPU. Dev mode and software WebGL
// (the regular e2e run) are too slow for timings to mean anything. Overwrites .next with the build.
//   pnpm test:motion [extra Playwright args]
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";

const PORT = 3100;
// B5: the hero's athlete, as the site shows it. `MOTION_CHARACTER=3d` tests the 3D tennis player
// instead (A8): its real file when it exists, otherwise the test dummy, copied in for this build only.
const player = process.env.MOTION_CHARACTER === "3d";
const REAL = "public/3d/character/character.glb";
const DUMMY = "public/3d/character/__test-dummy.glb";
const useDummy = player && !existsSync(REAL);
if (useDummy) {
  mkdirSync("public/3d/character", { recursive: true });
  copyFileSync("e2e/fixtures/character-dummy.glb", DUMMY);
}
const env = {
  ...process.env,
  NEXT_PUBLIC_MOTION_PROBE: "1",
  NEXT_PUBLIC_HERO_CHARACTER: player
    ? `/${(useDummy ? DUMMY : REAL).replace("public/", "")}`
    : "",
};
process.on("exit", () => {
  if (useDummy) rmSync(DUMMY, { force: true });
});

console.log("> next build (with the motion probe)");
const build = spawnSync("pnpm build", { stdio: "inherit", shell: true, env });
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
  { stdio: "ignore", env },
);
let status = 1;
try {
  const url = `http://localhost:${PORT}/`;
  for (let i = 0; ; i++) {
    if (
      await fetch(url).then(
        (r) => r.ok,
        () => false,
      )
    )
      break;
    if (i > 60) throw new Error(`next start did not come up on ${url}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  const args = process.argv
    .slice(2)
    // Quoted for the shell: spaces, and characters like | in a -g pattern.
    .map((a) => (/[\s|&<>^()]/.test(a) ? `"${a}"` : a))
    .join(" ");
  ({ status } = spawnSync(
    `pnpm exec playwright test --project motion ${args}`,
    {
      stdio: "inherit",
      shell: true,
      env: { ...env, MOTION: "1", E2E_BASE_URL: url },
    },
  ));
} finally {
  server.kill();
}
process.exit(status ?? 1);
