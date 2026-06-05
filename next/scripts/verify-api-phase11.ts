/**
 * Phase 11 — mock removed, verify:api, production prep docs.
 * Run: pnpm run verify:api:phase11
 */
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = join(import.meta.dirname, "..");

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

function main(): void {
  assert(
    !existsSync(join(root, "lib/mock/store.ts")) &&
      !existsSync(join(root, "lib/mock/seed.ts")),
    "lib/mock implementation removed",
  );

  const pkg = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };
  assert(pkg.scripts["verify:api"] != null, "verify:api script defined");
  assert(pkg.scripts["db:migrate:deploy"] != null, "db:migrate:deploy defined");

  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  assert(envExample.includes("DATABASE_URL"), ".env.example has DATABASE_URL");
  assert(envExample.includes("SESSION_SECRET"), ".env.example has SESSION_SECRET");
  assert(!envExample.includes("Mehdi123"), ".env.example has no dev password");

  const resetRoute = readFileSync(
    join(root, "app/api/dev/reset/route.ts"),
    "utf8",
  );
  assert(
    resetRoute.includes('NODE_ENV === "production"'),
    "dev reset blocked in production",
  );
  assert(resetRoute.includes("resetDevDatabase"), "dev reset uses DB seed");

  const completeDoc = readFileSync(
    join(import.meta.dirname, "../../docs/api-tasks/API-DB-COMPLETE.md"),
    "utf8",
  );
  assert(completeDoc.includes("✅"), "API-DB-COMPLETE.md filled");
  assert(completeDoc.includes("migrate deploy"), "deploy docs present");

  const apiReadme = readFileSync(
    join(import.meta.dirname, "../../docs/api-tasks/README.md"),
    "utf8",
  );
  assert(
    apiReadme.includes("API-DB-COMPLETE"),
    "api-tasks README links completion doc",
  );

  console.log("\nPhase 11 verification passed.");
  console.log("  Run `pnpm run verify:api` for full DB integration smoke.");
}

main();
