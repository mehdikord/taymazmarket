import "dotenv/config";
import { resetDevDatabase } from "@/lib/dev/reset-database";
import { notDeleted } from "@/lib/db/soft-delete";
import { toEntityId } from "@/lib/db/serialize";
import { prisma } from "@/lib/prisma";
import {
  RequestServiceError,
  approveRequest,
  countPendingRequests,
  listRequests,
  rejectRequest,
} from "@/lib/services/requests";

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
  await resetDevDatabase();
  const actorId = await getActorId();

  const pending = await listRequests({ status: ["pending"], pageSize: 50 });
  assert(pending.total === 5, "seed should have 5 pending requests");
  assert((await countPendingRequests()) === 5, "pending count");

  const historyDefault = await listRequests({
    status: ["approved", "rejected"],
    pageSize: 50,
  });
  assert(historyDefault.total === 10, "seed should have 10 history requests");

  const firstPending = pending.items[0]!;
  const approved = await approveRequest(firstPending.id, actorId);
  assert(approved.status === "approved", "approved status");
  assert(approved.reviewedById === actorId, "reviewedBy set");
  assert(Boolean(approved.reviewer?.name), "reviewer enriched");

  let doubleApprove = false;
  try {
    await approveRequest(firstPending.id, actorId);
  } catch (e) {
    doubleApprove = e instanceof RequestServiceError && e.status === 409;
  }
  assert(doubleApprove, "approve again must 409");

  assert((await countPendingRequests()) === 4, "pending count after approve");

  const secondPending = (await listRequests({ status: ["pending"] })).items[0]!;
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

  await resetDevDatabase();

  console.log("✓ Phase 7 verification passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
