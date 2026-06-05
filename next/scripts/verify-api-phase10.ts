/**
 * Phase 10 — panel on MySQL: no mock in production paths, dev reset → seed.
 * Run: pnpm run verify:api:phase10
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getDevPanelStats } from "../lib/dev/panel-stats";
import { resetDevDatabase } from "../lib/dev/reset-database";
import { getDashboardStats } from "../lib/stats/dashboard";
import { prisma } from "../lib/prisma";

const FORBIDDEN = /getStore\(|resetStore\(|from ["']@\/lib\/mock/;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsFiles(path));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      out.push(path);
    }
  }
  return out;
}

function assertNoMockInProductionPaths(): void {
  const root = join(import.meta.dirname, "..");
  const scanDirs = ["app", "lib/services", "lib/stats", "components"];
  for (const dir of scanDirs) {
    const base = join(root, dir);
    for (const file of walkTsFiles(base)) {
      if (file.includes("/lib/mock/")) continue;
      const text = readFileSync(file, "utf8");
      if (FORBIDDEN.test(text)) {
        throw new Error(`mock import in production path: ${file}`);
      }
    }
  }
}

async function main(): Promise<void> {
  assertNoMockInProductionPaths();
  assert(
    !readFileSync(
      join(import.meta.dirname, "../app/api/dev/reset/route.ts"),
      "utf8",
    ).includes("resetStore"),
    "dev reset route uses DB seed",
  );

  const before = await getDevPanelStats();
  assert(before.admins === 2, `seed admins: ${before.admins}`);
  assert(before.users === 10, `seed users: ${before.users}`);
  assert(before.currencies === 4, `seed currencies: ${before.currencies}`);
  assert(before.requests === 15, `seed requests: ${before.requests}`);
  assert(before.pendingRequests === 5, `seed pending: ${before.pendingRequests}`);
  assert(before.logs >= 50, `seed logs: ${before.logs}`);

  const stats = await getDashboardStats();
  assert(stats.pendingRequests === 5, "dashboard stats from DB");
  assert(stats.activeUsers === 5, "dashboard active users from DB");

  const tempMobile = "989129999887";
  await prisma.user.deleteMany({ where: { mobile: tempMobile } });
  await prisma.user.create({
    data: { mobile: tempMobile, name: "تست فاز ۱۰" },
  });
  assert(
    (await getDevPanelStats()).users === before.users + 1,
    "mutation visible in stats",
  );

  await resetDevDatabase();

  const after = await getDevPanelStats();
  assert(after.users === 10, "reset restores users");
  assert(after.pendingRequests === 5, "reset restores pending");
  assert(after.logs >= 50, "reset restores logs");

  const devPage = readFileSync(
    join(import.meta.dirname, "../app/(panel)/settings/dev/page.tsx"),
    "utf8",
  );
  assert(
    devPage.includes("getDevPanelStats"),
    "dev page reads stats from DB",
  );
  assert(!devPage.includes("getStore"), "dev page has no mock store");

  console.log("\nPhase 10 verification passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
