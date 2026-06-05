/**
 * Phase 1 — environment, Prisma init, MySQL connection, bcrypt.
 * Run: pnpm run verify:api:phase1
 */
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

const root = resolve(import.meta.dirname, "..");

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function main(): Promise<void> {
  const pkg = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  assert(
    Boolean(pkg.dependencies?.["@prisma/client"]),
    "@prisma/client in dependencies",
  );
  assert(Boolean(pkg.devDependencies?.prisma), "prisma in devDependencies");
  assert(Boolean(pkg.dependencies?.bcrypt), "bcrypt in dependencies");
  assert(
    Boolean(pkg.dependencies?.["@prisma/adapter-mariadb"]),
    "@prisma/adapter-mariadb in dependencies",
  );
  assert(Boolean(pkg.scripts?.["db:migrate"]), "db:migrate script");
  assert(Boolean(pkg.scripts?.["db:seed"]), "db:seed script");

  assert(existsSync(resolve(root, "prisma/schema.prisma")), "prisma/schema.prisma");
  assert(existsSync(resolve(root, "prisma.config.ts")), "prisma.config.ts");
  assert(
    existsSync(resolve(root, "lib/generated/prisma/client.ts")),
    "generated Prisma client (run pnpm db:generate)",
  );
  assert(existsSync(resolve(root, "lib/prisma.ts")), "lib/prisma.ts singleton");

  const envLocal = readFileSync(resolve(root, ".env.local"), "utf8");
  assert(envLocal.includes("DATABASE_URL"), ".env.local has DATABASE_URL");
  assert(
    envLocal.includes("taymaz"),
    ".env.local DATABASE_URL points to taymaz database",
  );

  const hash = await bcrypt.hash("admin123", 10);
  assert(await bcrypt.compare("admin123", hash), "bcrypt hash/compare works");

  try {
    const rows = await prisma.$queryRaw<{ ok: bigint }[]>`SELECT 1 AS ok`;
    assert(rows[0]?.ok === 1n || Number(rows[0]?.ok) === 1, "MySQL SELECT 1");
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nPhase 1 verification passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
