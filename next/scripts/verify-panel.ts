import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const apiScripts = [
  "verify:api",
  "verify:api:phase5",
  "verify:api:phase6",
  "verify:api:phase7",
  "verify:api:phase8",
  "verify:api:phase9",
  "verify:api:phase10",
];

const panelScripts = [
  "verify:phase3",
  "verify:phase4",
  "verify:phase5",
  "verify:phase6",
  "verify:phase7",
  "verify:phase8",
  "verify:phase9",
  "verify:phase10",
];

function run(script: string): void {
  console.log(`\n→ ${script}`);
  execSync(`pnpm run ${script}`, { cwd: root, stdio: "inherit" });
}

function main() {
  console.log("→ preflight: db:seed");
  execSync("pnpm run db:seed", { cwd: root, stdio: "inherit" });

  for (const script of apiScripts) {
    run(script);
  }

  console.log("\n→ smoke:qa");
  execSync("pnpm run smoke:qa", { cwd: root, stdio: "inherit" });

  for (const script of panelScripts) {
    run(script);
  }

  run("verify:api:phase11");

  console.log("\n✓ Full panel verification passed (API + smoke + panel scripts)");
}

main();
