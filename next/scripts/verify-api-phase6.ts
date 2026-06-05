/**
 * Phase 6 — admins & users services on Prisma.
 * Run: pnpm run verify:api:phase6
 */
import "dotenv/config";
import { mapAdminPublic } from "../lib/db/mappers";
import { notDeleted } from "../lib/db/soft-delete";
import { toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import {
  AdminServiceError,
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "../lib/services/admins";
import {
  UserServiceError,
  createUser,
  deleteUser,
  getUserTabCounts,
  listUsers,
  updateUser,
} from "../lib/services/users";

const TEST_ADMIN_MOBILE = "989129999001";
const TEST_USER_MOBILE = "989129999002";

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

async function cleanupTestData(): Promise<void> {
  const testUser = await prisma.user.findFirst({
    where: { mobile: TEST_USER_MOBILE },
  });
  if (testUser) {
    await prisma.userBankAccount.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  }
  await prisma.admin.deleteMany({
    where: { mobile: TEST_ADMIN_MOBILE },
  });
}

async function main(): Promise<void> {
  await cleanupTestData();
  const actorId = await getActorId();

  const seedAdmins = await listAdmins();
  assert(seedAdmins.length >= 2, "listAdmins returns seed admins");

  const createdAdmin = await createAdmin(
    {
      name: "مدیر تست API",
      mobile: TEST_ADMIN_MOBILE,
      password: "testpass99",
    },
    actorId,
  );
  assert(createdAdmin.mobile === TEST_ADMIN_MOBILE, "createAdmin");

  const afterCreate = await listAdmins();
  assert(
    afterCreate.some((a) => a.id === createdAdmin.id),
    "created admin in list",
  );

  const updatedAdmin = await updateAdmin(
    createdAdmin.id,
    { name: "مدیر تست ویرایش" },
    actorId,
  );
  assert(updatedAdmin.name === "مدیر تست ویرایش", "updateAdmin name");

  let duplicateAdmin = false;
  try {
    await createAdmin(
      { name: "تکراری", mobile: TEST_ADMIN_MOBILE, password: "x" },
      actorId,
    );
  } catch (e) {
    duplicateAdmin = e instanceof AdminServiceError && e.status === 409;
  }
  assert(duplicateAdmin, "duplicate admin mobile → 409");

  let selfDelete = false;
  try {
    await deleteAdmin(actorId, actorId);
  } catch (e) {
    selfDelete =
      e instanceof AdminServiceError && e.code === "cannot_delete_self";
  }
  assert(selfDelete, "cannot delete self admin");

  await deleteAdmin(createdAdmin.id, actorId);
  const deletedRow = await prisma.admin.findFirst({
    where: { id: BigInt(createdAdmin.id) },
  });
  assert(deletedRow?.deletedAt != null, "admin soft-deleted in DB");
  assert(
    !(await listAdmins()).some((a) => a.id === createdAdmin.id),
    "deleted admin not in listAdmins",
  );

  const counts = await getUserTabCounts();
  assert(counts.all >= 10, "tab count all");
  assert(counts.active === 5, "tab count active (seed)");
  assert(counts.inactive === 5, "tab count inactive (seed)");

  const activePage = await listUsers({ tab: "active", page: 1, pageSize: 10 });
  assert(activePage.items.length === 5, "active tab page items");
  assert(activePage.total === 5, "active tab total");

  const page2 = await listUsers({ tab: "all", page: 2, pageSize: 5 });
  assert(page2.page === 2 && page2.items.length === 5, "pagination page 2");

  const createdUser = await createUser(
    {
      name: "کاربر تست API",
      mobile: TEST_USER_MOBILE,
      verificationCode: "ABCD12",
    },
    actorId,
  );
  assert(createdUser.verificationCode === "ABCD12", "createUser code");

  await updateUser(
    createdUser.id,
    { verificationCode: null, name: "کاربر ویرایش‌شده" },
    actorId,
  );
  const updatedRow = await prisma.user.findUnique({
    where: { id: BigInt(createdUser.id) },
  });
  assert(updatedRow?.name === "کاربر ویرایش‌شده", "updateUser name");
  assert(updatedRow?.verificationCode === null, "updateUser clears code");

  let duplicateUser = false;
  try {
    await createUser({ name: "تکراری", mobile: TEST_USER_MOBILE }, actorId);
  } catch (e) {
    duplicateUser = e instanceof UserServiceError && e.status === 409;
  }
  assert(duplicateUser, "duplicate user mobile → 409");

  const userWithRequest = await prisma.user.findFirst({
    where: {
      ...notDeleted,
      exchangeRequests: { some: {} },
    },
  });
  assert(Boolean(userWithRequest), "user with requests exists in seed");
  let hasRequestsBlock = false;
  try {
    await deleteUser(toEntityId(userWithRequest!.id), actorId);
  } catch (e) {
    hasRequestsBlock =
      e instanceof UserServiceError && e.code === "has_requests";
  }
  assert(hasRequestsBlock, "cannot delete user with requests");

  await deleteUser(createdUser.id, actorId);
  const deletedUser = await prisma.user.findUnique({
    where: { id: BigInt(createdUser.id) },
  });
  assert(deletedUser?.deletedAt != null, "user soft-deleted");

  const withCode = await listUsers({
    tab: "all",
    hasCode: "true",
    pageSize: 50,
  });
  assert(
    withCode.items.every((u) => u.verificationCode != null),
    "hasCode=true filter",
  );

  JSON.stringify(mapAdminPublic(
    (await prisma.admin.findFirst({
      where: { mobile: "989121111111", ...notDeleted },
    }))!,
  ));

  await cleanupTestData();

  console.log("\nPhase 6 verification passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
