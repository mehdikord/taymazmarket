/**
 * Phase 7 — currencies, logs, dashboard stats on Prisma.
 * Run: pnpm run verify:api:phase7
 */
import "dotenv/config";
import { toEntityId } from "../lib/db/serialize";
import { getCountries } from "../lib/countries";
import { notDeleted } from "../lib/db/soft-delete";
import { prisma } from "../lib/prisma";
import {
  CurrencyServiceError,
  createCurrencyFromCode,
  deleteCurrency,
  listCurrencies,
  updateCurrencyFromCode,
} from "../lib/services/currencies";
import { getLog, listLogs } from "../lib/services/logs";
import {
  getDashboardStats,
  getRecentLogs,
  getRecentPendingRequests,
} from "../lib/stats/dashboard";

const TEST_CURRENCY_SLUG = "gbp-verify7";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function getActorId(): Promise<number> {
  const row = await prisma.admin.findFirst({
    where: { mobile: "989121111111", ...notDeleted },
  });
  if (!row) throw new Error("demo admin missing — run pnpm db:seed");
  return toEntityId(row.id);
}

async function cleanupTestCurrency(): Promise<void> {
  await prisma.currency.deleteMany({ where: { slug: TEST_CURRENCY_SLUG } });
}

async function main(): Promise<void> {
  await cleanupTestCurrency();
  const actorId = await getActorId();

  const countries = await getCountries();
  assert(countries.length === 5, "5 countries from DB");

  const all = await listCurrencies();
  assert(all.length === 4, "seed has 4 currencies");

  const activeOnly = await listCurrencies(true);
  assert(activeOnly.every((c) => c.isActive), "activeOnly filter");
  assert(
    activeOnly.every((c) => c.countryCode.length === 2),
    "countryCode enriched",
  );

  const stats = await getDashboardStats();
  assert(stats.pendingRequests === 5, "dashboard pending count");
  assert(stats.activeUsers === 5, "dashboard active users");
  assert(stats.inactiveUsers === 5, "dashboard inactive users");
  assert(stats.totalRequests === 15, "dashboard total requests");
  assert(
    stats.requestBreakdown.pending +
      stats.requestBreakdown.approved +
      stats.requestBreakdown.rejected ===
      15,
    "breakdown sums to total",
  );

  const recentLogs = await getRecentLogs(5);
  assert(recentLogs.length === 5, "recent logs from DB");

  const pendingPreview = await getRecentPendingRequests(4);
  assert(pendingPreview.length === 4, "pending preview count");
  assert(
    pendingPreview.every((r) => r.label.includes("→")),
    "pending preview labels enriched",
  );

  const created = await createCurrencyFromCode(
    {
      title: "پوند تست",
      slug: TEST_CURRENCY_SLUG,
      countryCode: "DE",
      isActive: true,
      sortOrder: 99,
    },
    actorId,
  );
  assert(created.slug === TEST_CURRENCY_SLUG, "currency created");

  assert((await listCurrencies()).length === 5, "list after create");

  let slugDup = false;
  try {
    await createCurrencyFromCode(
      { title: "تکراری", slug: TEST_CURRENCY_SLUG, countryCode: "IR" },
      actorId,
    );
  } catch (e) {
    slugDup = e instanceof CurrencyServiceError && e.status === 409;
  }
  assert(slugDup, "duplicate slug → 409");

  await updateCurrencyFromCode(created.id, { isActive: false }, actorId);
  assert(
    (await listCurrencies(true)).every((c) => c.id !== created.id),
    "inactive hidden from activeOnly",
  );

  const usedCurrency = await prisma.currency.findFirst({
    where: {
      OR: [
        { sourceExchangeRequests: { some: {} } },
        { targetExchangeRequests: { some: {} } },
      ],
    },
    select: { id: true },
  });
  if (usedCurrency) {
    let inUseBlock = false;
    try {
      await deleteCurrency(toEntityId(usedCurrency.id), actorId);
    } catch (e) {
      inUseBlock = e instanceof CurrencyServiceError && e.code === "in_use";
    }
    assert(inUseBlock, "cannot delete currency in requests");
  }

  await deleteCurrency(created.id, actorId);
  assert((await listCurrencies()).length === 4, "list after delete test currency");

  const logsPage1 = await listLogs({ page: 1, pageSize: 20 });
  assert(logsPage1.total >= 50, "seed has at least 50 logs");
  assert(logsPage1.items.length === 20, "logs page size 20");

  const sorted = (await listLogs({ pageSize: 5 })).items;
  assert(
    new Date(sorted[0]!.createdAt).getTime() >=
      new Date(sorted[1]!.createdAt).getTime(),
    "logs sorted createdAt desc",
  );

  const adminLogs = await listLogs({ actorType: "admin", pageSize: 50 });
  assert(
    adminLogs.items.every((l) => l.actorType === "admin"),
    "actorType filter",
  );

  const actorRow = await prisma.admin.findUnique({
    where: { id: BigInt(actorId) },
    select: { name: true },
  });
  const enriched = adminLogs.items.find((l) => l.actorId === actorId);
  assert(
    enriched?.actorDisplayName === actorRow?.name,
    "actor name enriched from DB",
  );

  const byAction = await listLogs({ action: "request.approve", pageSize: 10 });
  assert(
    byAction.items.every((l) => l.action.includes("request.approve")),
    "action contains filter",
  );

  const firstLog = await prisma.systemLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (firstLog) {
    const one = await getLog(toEntityId(firstLog.id));
    assert(one?.id === toEntityId(firstLog.id), "getLog by id");
  }

  await cleanupTestCurrency();
  console.log("\nPhase 7 verification passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
