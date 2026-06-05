/**
 * تجمیع verify ربات — فاز ۱۲
 */
import { execSync } from "node:child_process";

const steps = [
  "verify:bot:phase2",
  "verify:bot:phase3",
  "verify:bot:phase8",
  "verify:bot:phase10",
] as const;

function runPhase1Optional(): void {
  console.info("\n--- verify:bot:phase1 (optional, needs Telegram API) ---");
  try {
    execSync("pnpm run verify:bot:phase1", { stdio: "inherit", cwd: process.cwd() });
  } catch {
    console.warn("SKIP: verify:bot:phase1 — network or Telegram unreachable");
  }
}

for (const script of steps) {
  console.info(`\n--- ${script} ---`);
  execSync(`pnpm run ${script}`, { stdio: "inherit", cwd: process.cwd() });
}

runPhase1Optional();

console.info("\nverify:bot: all required steps passed");
