/**
 * Phase 8 — exchange requests service on Prisma.
 * Run: pnpm run verify:api:phase8
 */
import "dotenv/config";
import { notDeleted } from "../lib/db/soft-delete";
import { toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import {
  RequestServiceError,
  approveRequest,
  countPendingRequests,
  listRequests,
  rejectRequest,
} from "../lib/services/requests";
import { generateTrackingCode } from "../lib/services/tracking-code";

type RevertSnapshot = {
  id: bigint;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  reviewedById: bigint | null;
  reviewedAt: Date | null;
};

const reverts: RevertSnapshot[] = [];

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

async function snapshotForRevert(id: bigint): Promise<void> {
  const row = await prisma.exchangeRequest.findUnique({ where: { id } });
  if (row) {
    reverts.push({
      id: row.id,
      status: row.status,
      rejectionReason: row.rejectionReason,
      reviewedById: row.reviewedById,
      reviewedAt: row.reviewedAt,
    });
  }
}

async function restoreMutatedRequests(): Promise<void> {
  for (const snap of reverts) {
    await prisma.exchangeRequest.update({
      where: { id: snap.id },
      data: {
        status: snap.status,
        rejectionReason: snap.rejectionReason,
        reviewedById: snap.reviewedById,
        reviewedAt: snap.reviewedAt,
      },
    });
  }
}

async function main(): Promise<void> {
  const actorId = await getActorId();
  const actorRow = await prisma.admin.findUnique({
    where: { id: BigInt(actorId) },
    select: { name: true },
  });

  const pending = await listRequests({ status: ["pending"], pageSize: 50 });
  assert(pending.total === 5, "seed has 5 pending requests");
  assert((await countPendingRequests()) === 5, "countPendingRequests");

  const historyDefault = await listRequests({
    status: ["approved", "rejected"],
    pageSize: 50,
  });
  assert(historyDefault.total === 10, "seed has 10 history requests");

  const firstPending = pending.items[0]!;
  await snapshotForRevert(BigInt(firstPending.id));

  const approved = await approveRequest(firstPending.id, actorId);
  assert(approved.status === "approved", "approved status");
  assert(approved.reviewedById === actorId, "reviewedBy set");
  assert(approved.reviewer?.name === actorRow?.name, "reviewer enriched");

  let doubleApprove = false;
  try {
    await approveRequest(firstPending.id, actorId);
  } catch (e) {
    doubleApprove = e instanceof RequestServiceError && e.status === 409;
  }
  assert(doubleApprove, "approve again → 409");

  assert((await countPendingRequests()) === 4, "pending count after approve");

  const secondPending = (await listRequests({ status: ["pending"] })).items[0]!;
  await snapshotForRevert(BigInt(secondPending.id));

  const rejected = await rejectRequest(
    secondPending.id,
    "فاکتور نامعتبر",
    actorId,
  );
  assert(rejected.status === "rejected", "rejected status");
  assert(rejected.rejectionReason === "فاکتور نامعتبر", "reason stored");

  const byCode = await listRequests({
    trackingCode: rejected.trackingCode,
    pageSize: 10,
  });
  assert(byCode.items.length === 1, "filter by tracking code");

  const approvedOnly = await listRequests({
    status: ["approved"],
    pageSize: 50,
  });
  assert(
    approvedOnly.items.every((r) => r.status === "approved"),
    "approved filter",
  );

  const enriched = approvedOnly.items[0]!;
  assert(enriched.user.mobile.length > 5, "user enriched");
  assert(enriched.sourceCurrency.title.length > 0, "currency enriched");
  assert(enriched.invoiceImageUrl.startsWith("/"), "invoice URL present");

  const code1 = await generateTrackingCode();
  const code2 = await generateTrackingCode();
  assert(code1.length === 8, "tracking code 8 digits");
  assert(code1 !== code2, "tracking codes differ");

  const existingCodes = await prisma.exchangeRequest.findMany({
    select: { trackingCode: true },
  });
  const unique = new Set(existingCodes.map((r) => r.trackingCode));
  assert(unique.size === existingCodes.length, "seed tracking codes unique");

  await restoreMutatedRequests();
  assert((await countPendingRequests()) === 5, "pending restored after revert");

  console.log("\nPhase 8 verification passed.");
}

main()
  .catch(async (e) => {
    console.error(e);
    await restoreMutatedRequests().catch(() => {});
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
