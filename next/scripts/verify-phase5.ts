import "dotenv/config";
import { toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import {
  AdminServiceError,
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "../lib/services/admins";

const TEST_MOBILE = "989129999003";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  await prisma.admin.deleteMany({ where: { mobile: TEST_MOBILE } });

  const actorRow = await prisma.admin.findFirst({
    where: { mobile: "989121111111", deletedAt: null },
  });
  if (!actorRow) throw new Error("demo admin missing");
  const actorId = toEntityId(actorRow.id);

  assert((await listAdmins()).length >= 2, "seed should have 2+ admins");

  const created = await createAdmin(
    {
      name: "مدیر تست",
      mobile: TEST_MOBILE,
      password: "test1234",
    },
    actorId,
  );
  assert((await listAdmins()).length >= 3, "after create");

  await updateAdmin(created.id, { name: "مدیر تست ویرایش" }, actorId);
  assert(
    (await listAdmins()).find((a) => a.id === created.id)?.name ===
      "مدیر تست ویرایش",
    "name updated",
  );

  let duplicateOk = false;
  try {
    await createAdmin(
      { name: "تکراری", mobile: TEST_MOBILE, password: "x" },
      actorId,
    );
  } catch (e) {
    duplicateOk = e instanceof AdminServiceError && e.status === 409;
  }
  assert(duplicateOk, "duplicate mobile must 409");

  let selfDeleteOk = false;
  try {
    await deleteAdmin(actorId, actorId);
  } catch (e) {
    selfDeleteOk =
      e instanceof AdminServiceError && e.code === "cannot_delete_self";
  }
  assert(selfDeleteOk, "cannot delete self");

  await deleteAdmin(created.id, actorId);
  assert(
    (await listAdmins()).find((a) => a.id === created.id) === undefined,
    "deleted admin not in list",
  );

  await prisma.admin.deleteMany({ where: { mobile: TEST_MOBILE } });

  console.log("✓ Phase 5 verification passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
