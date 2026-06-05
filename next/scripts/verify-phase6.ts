import "dotenv/config";
import { toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import {
  UserServiceError,
  createUser,
  deleteUser,
  getUserTabCounts,
  listUsers,
  updateUser,
} from "../lib/services/users";

const TEST_MOBILE = "989129999004";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  await prisma.user.deleteMany({ where: { mobile: TEST_MOBILE } });

  const actorRow = await prisma.admin.findFirst({
    where: { mobile: "989121111111", deletedAt: null },
  });
  if (!actorRow) throw new Error("demo admin missing");
  const actorId = toEntityId(actorRow.id);

  const counts = await getUserTabCounts();
  assert(counts.all >= 10, "seed should have 10+ users");
  assert(counts.active === 5, "seed should have 5 active users");
  assert(counts.inactive === 5, "seed should have 5 inactive users");

  const activePage = await listUsers({ tab: "active", page: 1, pageSize: 10 });
  assert(activePage.items.length === 5, "active tab returns all active users");
  assert(activePage.total === 5, "active tab total");
  const page2 = await listUsers({ tab: "all", page: 2, pageSize: 5 });
  assert(page2.page === 2 && page2.items.length === 5, "pagination page 2");

  const created = await createUser(
    {
      name: "کاربر تست",
      mobile: TEST_MOBILE,
      verificationCode: "ABCD12",
    },
    actorId,
  );
  assert(created.verificationCode === "ABCD12", "verification code stored");

  await updateUser(
    created.id,
    { verificationCode: null, name: "کاربر تست ویرایش" },
    actorId,
  );
  const updated = await prisma.user.findUnique({
    where: { id: BigInt(created.id) },
  });
  assert(updated?.name === "کاربر تست ویرایش", "name updated");
  assert(updated?.verificationCode === null, "code cleared -> inactive");

  let duplicateOk = false;
  try {
    await createUser({ name: "تکراری", mobile: TEST_MOBILE }, actorId);
  } catch (e) {
    duplicateOk = e instanceof UserServiceError && e.status === 409;
  }
  assert(duplicateOk, "duplicate mobile must 409");

  const userWithRequest = await prisma.user.findFirst({
    where: { deletedAt: null, exchangeRequests: { some: {} } },
  });
  assert(Boolean(userWithRequest), "user with requests exists");
  let hasRequestsBlock = false;
  try {
    await deleteUser(toEntityId(userWithRequest!.id), actorId);
  } catch (e) {
    hasRequestsBlock =
      e instanceof UserServiceError && e.code === "has_requests";
  }
  assert(hasRequestsBlock, "cannot delete user with requests");

  await deleteUser(created.id, actorId);
  const deleted = await prisma.user.findUnique({
    where: { id: BigInt(created.id) },
  });
  assert(deleted?.deletedAt != null, "soft deleted");

  const filtered = await listUsers({
    tab: "all",
    hasCode: "true",
    pageSize: 50,
  });
  assert(
    filtered.items.every((u) => u.verificationCode != null),
    "hasCode=true filter",
  );

  await prisma.user.deleteMany({ where: { mobile: TEST_MOBILE } });

  console.log("✓ Phase 6 verification passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
