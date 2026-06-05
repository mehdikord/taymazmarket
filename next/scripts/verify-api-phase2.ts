/**
 * Phase 2 — full schema + init migration + generated client models.
 * Run: pnpm run verify:api:phase2
 */
import "dotenv/config";
import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { prisma } from "../lib/prisma";

const root = resolve(import.meta.dirname, "..");

const EXPECTED_TABLES = [
  "countries",
  "admins",
  "users",
  "currencies",
  "user_bank_accounts",
  "exchange_requests",
  "system_logs",
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function main(): Promise<void> {
  const schema = readFileSync(resolve(root, "prisma/schema.prisma"), "utf8");
  for (const model of [
    "Country",
    "Admin",
    "User",
    "Currency",
    "UserBankAccount",
    "ExchangeRequest",
    "SystemLog",
  ]) {
    assert(schema.includes(`model ${model}`), `schema has model ${model}`);
  }

  const migrationsDir = resolve(root, "prisma/migrations");
  assert(existsSync(migrationsDir), "prisma/migrations exists");
  const migrationFolders = readdirSync(migrationsDir).filter((f) =>
    /^\d+_.+/.test(f),
  );
  assert(migrationFolders.length >= 1, "at least one migration folder");
  const initMigration = migrationFolders.find((f) => f.includes("_init"));
  assert(Boolean(initMigration), "init migration folder exists");

  const sql = readFileSync(
    resolve(migrationsDir, initMigration!, "migration.sql"),
    "utf8",
  );
  assert(sql.includes("utf8mb4"), "migration uses utf8mb4");
  for (const table of EXPECTED_TABLES) {
    assert(sql.includes(`\`${table}\``), `migration creates ${table}`);
  }
  assert(
    sql.includes("user_bank_accounts_user_id_currency_id_account_number_key"),
    "composite unique on bank accounts",
  );

  assert(
    existsSync(resolve(root, "lib/generated/prisma/client.ts")),
    "generated client.ts",
  );

  try {
    const delegates: { name: string; count: () => Promise<number> }[] = [
      { name: "countries", count: () => prisma.country.count() },
      { name: "admins", count: () => prisma.admin.count() },
      { name: "users", count: () => prisma.user.count() },
      { name: "currencies", count: () => prisma.currency.count() },
      { name: "user_bank_accounts", count: () => prisma.userBankAccount.count() },
      { name: "exchange_requests", count: () => prisma.exchangeRequest.count() },
      { name: "system_logs", count: () => prisma.systemLog.count() },
    ];
    for (const { name, count } of delegates) {
      const n = await count();
      assert(typeof n === "number", `query ${name} (table exists, count=${n})`);
    }

    assert(typeof prisma.country === "object", "prisma.country delegate");
    assert(typeof prisma.admin === "object", "prisma.admin delegate");
    assert(typeof prisma.user === "object", "prisma.user delegate");
    assert(typeof prisma.currency === "object", "prisma.currency delegate");
    assert(
      typeof prisma.userBankAccount === "object",
      "prisma.userBankAccount delegate",
    );
    assert(
      typeof prisma.exchangeRequest === "object",
      "prisma.exchangeRequest delegate",
    );
    assert(typeof prisma.systemLog === "object", "prisma.systemLog delegate");
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nPhase 2 verification passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
