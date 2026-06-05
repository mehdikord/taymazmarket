import "dotenv/config";
import { toEntityId } from "@/lib/db/serialize";
import { notDeleted } from "@/lib/db/soft-delete";
import { prisma } from "@/lib/prisma";
import {
  CurrencyServiceError,
  createCurrencyFromCode,
  deleteCurrency,
  listCurrencies,
  updateCurrencyFromCode,
} from "@/lib/services/currencies";
import { getLog, listLogs } from "@/lib/services/logs";

const TEST_SLUG = "gbp-phase8";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function getActorId(): Promise<number> {
  const row = await prisma.admin.findFirst({
    where: { mobile: "989121111111", ...notDeleted },
  });
  if (!row) throw new Error("run pnpm db:seed first");
  return toEntityId(row.id);
}

async function main(): Promise<void> {
  await prisma.currency.deleteMany({ where: { slug: TEST_SLUG } });
  const actorId = await getActorId();

  const all = await listCurrencies();
  assert(all.length === 4, "seed should have 4 currencies");

  const activeOnly = await listCurrencies(true);
  assert(activeOnly.every((c) => c.isActive), "activeOnly filter");

  const created = await createCurrencyFromCode(
    {
      title: "پوند",
      slug: TEST_SLUG,
      countryCode: "DE",
      isActive: true,
      sortOrder: 5,
    },
    actorId,
  );
  assert(created.slug === TEST_SLUG, "currency created");
  assert((await listCurrencies()).length === 5, "after create");

  let slugDup = false;
  try {
    await createCurrencyFromCode(
      { title: "تکراری", slug: TEST_SLUG, countryCode: "IR" },
      actorId,
    );
  } catch (e) {
    slugDup = e instanceof CurrencyServiceError && e.status === 409;
  }
  assert(slugDup, "duplicate slug must 409");

  await updateCurrencyFromCode(created.id, { isActive: false }, actorId);
  assert(
    (await listCurrencies(true)).find((c) => c.id === created.id) === undefined,
    "inactive hidden from activeOnly",
  );

  const usedRow = await prisma.currency.findFirst({
    where: {
      OR: [
        { sourceExchangeRequests: { some: {} } },
        { targetExchangeRequests: { some: {} } },
      ],
    },
    select: { id: true },
  });
  if (usedRow) {
    let inUseBlock = false;
    try {
      await deleteCurrency(toEntityId(usedRow.id), actorId);
    } catch (e) {
      inUseBlock = e instanceof CurrencyServiceError && e.code === "in_use";
    }
    assert(inUseBlock, "cannot delete currency in requests");
  }

  await deleteCurrency(created.id, actorId);
  assert((await listCurrencies()).length === 4, "after delete unused currency");

  const logsPage1 = await listLogs({ page: 1, pageSize: 20 });
  assert(logsPage1.total >= 50, "seed should have at least 50 logs");
  assert(logsPage1.items.length === 20, "page size 20");

  const sorted = (await listLogs({ pageSize: 5 })).items;
  assert(
    new Date(sorted[0]!.createdAt).getTime() >=
      new Date(sorted[1]!.createdAt).getTime(),
    "sort createdAt desc",
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
  assert(enriched?.actorDisplayName === actorRow?.name, "actor name enriched");

  const byAction = await listLogs({ action: "request.approve", pageSize: 10 });
  assert(
    byAction.items.every((l) => l.action.includes("request.approve")),
    "action contains filter",
  );

  const first = await prisma.systemLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (first) {
    const one = await getLog(toEntityId(first.id));
    assert(one?.id === toEntityId(first.id), "getLog by id");
  }

  console.log("✓ Phase 8 verification passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
