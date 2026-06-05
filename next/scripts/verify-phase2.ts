/**
 * Phase 2 (panel) — seed data integrity on MySQL (replaces in-memory mock store checks).
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const [countries, admins, users, currencies, requests, logs, bankAccounts] =
    await Promise.all([
      prisma.country.count(),
      prisma.admin.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.currency.count(),
      prisma.exchangeRequest.count(),
      prisma.systemLog.count(),
      prisma.userBankAccount.count(),
    ]);

  assert(countries === 5, `expected 5 countries, got ${countries}`);
  assert(admins === 2, `expected 2 admins, got ${admins}`);
  assert(users === 10, `expected 10 users, got ${users}`);
  assert(currencies === 4, `expected 4 currencies, got ${currencies}`);
  assert(requests === 15, `expected 15 requests, got ${requests}`);
  assert(logs >= 50, `expected >= 50 logs, got ${logs}`);
  assert(bankAccounts >= 5, `expected >= 5 bank accounts, got ${bankAccounts}`);

  const codes = await prisma.exchangeRequest.findMany({
    select: { trackingCode: true },
  });
  assert(
    new Set(codes.map((c) => c.trackingCode)).size === codes.length,
    "tracking codes must be unique",
  );

  console.log("✓ Phase 2 verification passed (DB seed)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
