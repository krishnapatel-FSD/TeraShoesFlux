// Runs the local quality gates in order and stops at the first failure.
// A Node script rather than `a && b` so it works in every shell pnpm may use (sh, cmd, PowerShell 5).
import { spawnSync } from "node:child_process";

for (const script of [
  "typecheck",
  "lint",
  "format:check",
  "test",
  "tokens:check",
  "theme:check",
]) {
  console.log(`\n> pnpm ${script}`);
  const { status } = spawnSync(`pnpm ${script}`, {
    stdio: "inherit",
    shell: true,
  });
  if (status !== 0) process.exit(status ?? 1);
}
