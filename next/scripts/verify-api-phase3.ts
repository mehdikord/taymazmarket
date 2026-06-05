/**
 * Phase 3 — seed data (PRD §12) + bcrypt admin + idempotent re-seed.
 * Run: pnpm run verify:api:phase3
 */
import "dotenv/config";
import { verifyPassword } from "../lib/auth/password";
import { prisma } from "../lib/prisma";
import { runSeed } from "../prisma/seed/run";

const DEMO_MOBILE = "989121111111";
const DEMO_PASSWORD = "admin123";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function expectCounts(): Promise<void> {
  const [
    countries,
    admins,
    users,
    activeUsers,
    inactiveUsers,
    currencies,
    bankAccounts,
    requests,
    pending,
    approved,
    rejected,
    logs,
  ] = await Promise.all([
    prisma.country.count(),
    prisma.admin.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { verificationCode: { not: null }, deletedAt: null },
    }),
    prisma.user.count({
      where: { verificationCode: null, deletedAt: null },
    }),
    prisma.currency.count(),
    prisma.userBankAccount.count(),
    prisma.exchangeRequest.count(),
    prisma.exchangeRequest.count({ where: { status: "pending" } }),
    prisma.exchangeRequest.count({ where: { status: "approved" } }),
    prisma.exchangeRequest.count({ where: { status: "rejected" } }),
    prisma.systemLog.count(),
  ]);

  assert(countries === 5, "5 countries");
  assert(admins >= 2, "≥2 admins");
  assert(users >= 10, "≥10 users");
  assert(activeUsers === 5, "5 active users (verification_code set)");
  assert(inactiveUsers === 5, "5 inactive users");
  assert(currencies >= 4, "≥4 currencies");
  assert(bankAccounts >= 7, "≥7 bank accounts");
  assert(requests >= 15, "≥15 exchange requests");
  assert(pending >= 5, "≥5 pending requests");
  assert(approved >= 5, "≥5 approved requests");
  assert(rejected >= 5, "≥5 rejected requests");
  assert(logs >= 50, "≥50 system logs");
}

async function expectDemoAdmin(): Promise<void> {
  const admin = await prisma.admin.findFirst({
    where: { mobile: DEMO_MOBILE, deletedAt: null },
  });
  assert(Boolean(admin), "demo admin exists");
  assert(
    await verifyPassword(DEMO_PASSWORD, admin!.passwordHash),
    "demo password admin123 matches bcrypt hash",
  );
  assert(
    admin!.passwordHash.startsWith("$2"),
    "password stored as bcrypt hash",
  );
}

async function expectReferenceData(): Promise<void> {
  const ir = await prisma.country.findUnique({ where: { code: "IR" } });
  assert(Boolean(ir), "country IR exists");
  const rials = await prisma.currency.findUnique({ where: { slug: "rials" } });
  assert(Boolean(rials), "currency rials exists");
  assert(rials!.countryId === ir!.id, "rials linked to IR");

  const codes = await prisma.exchangeRequest.findMany({
    select: { trackingCode: true },
  });
  assert(codes.length === new Set(codes.map((c) => c.trackingCode)).size, "tracking codes unique");
}

async function main(): Promise<void> {
  await expectCounts();
  await expectDemoAdmin();
  await expectReferenceData();

  console.log("\nRe-running seed (idempotent clear + insert)…");
  await runSeed();
  await expectCounts();
  await expectDemoAdmin();

  console.log("\nPhase 3 verification passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
