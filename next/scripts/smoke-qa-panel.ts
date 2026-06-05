/**
 * سناریوی QA خودکار — سرویس‌ها روی MySQL (پس از seed).
 */
import "dotenv/config";
import { toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import { getUserStatus } from "../lib/types";
import {
  AdminServiceError,
  listAdmins,
  createAdmin,
  deleteAdmin,
} from "../lib/services/admins";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../lib/services/users";
import {
  approveRequest,
  listRequests,
  rejectRequest,
} from "../lib/services/requests";
import {
  listCurrencies,
  updateCurrencyFromCode,
} from "../lib/services/currencies";
import { listLogs } from "../lib/services/logs";
import { resetDevDatabase } from "../lib/dev/reset-database";
import { getDashboardStats } from "../lib/stats/dashboard";

const QA_ADMIN_MOBILE = "989123333331";
const QA_USER_MOBILE = "989123333332";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[QA] ${message}`);
}

async function main(): Promise<void> {
  const actorRow = await prisma.admin.findFirst({
    where: { mobile: "989121111111", deletedAt: null },
  });
  if (!actorRow) throw new Error("run pnpm db:seed first");
  const actorId = toEntityId(actorRow.id);

  await prisma.admin.deleteMany({ where: { mobile: QA_ADMIN_MOBILE } });
  await prisma.user.deleteMany({ where: { mobile: QA_USER_MOBILE } });

  const stats = await getDashboardStats();
  assert(stats.pendingRequests === 5, "dashboard pending count");
  assert(stats.activeUsers === 5, "dashboard active users");

  const third = await createAdmin(
    { name: "مدیر QA", mobile: QA_ADMIN_MOBILE, password: "qa123456" },
    actorId,
  );
  assert((await listAdmins()).length >= 3, "third admin created");
  let selfDeleteBlocked = false;
  try {
    await deleteAdmin(actorId, actorId);
  } catch (e) {
    selfDeleteBlocked =
      e instanceof AdminServiceError && e.code === "cannot_delete_self";
  }
  assert(selfDeleteBlocked, "cannot delete self");
  await deleteAdmin(third.id, actorId);

  const inactive = await listUsers({ tab: "inactive", pageSize: 50 });
  assert(inactive.total === 5, "5 inactive users tab");
  const createdUser = await createUser(
    {
      name: "کاربر QA",
      mobile: QA_USER_MOBILE,
      verificationCode: "QA1234",
    },
    actorId,
  );
  assert(getUserStatus(createdUser) === "active", "new user active with code");
  const cleared = await updateUser(
    createdUser.id,
    { verificationCode: null },
    actorId,
  );
  assert(getUserStatus(cleared) === "inactive", "cleared code -> inactive");
  await deleteUser(createdUser.id, actorId);

  const pending = await listRequests({ status: ["pending"], pageSize: 50 });
  assert(pending.total >= 1, "has pending requests");
  const toApprove = pending.items[0]!;
  await approveRequest(toApprove.id, actorId);
  const pendingAfter = await listRequests({
    status: ["pending"],
    pageSize: 50,
  });
  assert(
    pendingAfter.total === pending.total - 1,
    "approved removed from pending",
  );

  const pending2 = await listRequests({ status: ["pending"], pageSize: 1 });
  if (pending2.items[0]) {
    const toReject = pending2.items[0];
    await rejectRequest(toReject.id, "تست QA رد", actorId);
    const rejected = await listRequests({
      status: ["rejected"],
      trackingCode: toReject.trackingCode,
    });
    assert(
      rejected.items[0]?.rejectionReason === "تست QA رد",
      "reject reason",
    );
  }

  const currency = (await listCurrencies())[0]!;
  await updateCurrencyFromCode(currency.id, { isActive: false }, actorId);
  assert(
    (await listCurrencies(true)).every((c) => c.id !== currency.id),
    "currency deactivated",
  );
  await updateCurrencyFromCode(currency.id, { isActive: true }, actorId);

  const approveLogs = await listLogs({ action: "request.approve", pageSize: 10 });
  assert(approveLogs.items.length >= 1, "approve log exists");
  const allLogs = await listLogs({ pageSize: 5 });
  assert(allLogs.total >= 50, "at least 50 logs seed");

  await prisma.admin.deleteMany({ where: { mobile: QA_ADMIN_MOBILE } });
  await prisma.user.deleteMany({ where: { mobile: QA_USER_MOBILE } });

  await resetDevDatabase();

  console.log("✓ Smoke QA panel passed (DB services, DB re-seeded)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
