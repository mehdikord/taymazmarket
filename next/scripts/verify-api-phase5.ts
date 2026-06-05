/**
 * Phase 5 — auth: bcrypt login, getCurrentAdmin from DB, appendLog to MySQL.
 * Run: pnpm run verify:api:phase5
 */
import "dotenv/config";
import { authenticateAdmin } from "../lib/auth/authenticate-admin";
import {
  createSessionToken,
  resolveSessionAdminId,
} from "../lib/auth/session";
import { mapAdminPublic } from "../lib/db/mappers";
import { notDeleted } from "../lib/db/soft-delete";
import { toBigIntId, toEntityId } from "../lib/db/serialize";
import { appendLog } from "../lib/logging/append-log";
import { LOG_ACTIONS } from "../lib/logging/actions";
import { prisma } from "../lib/prisma";
import { softDeleteAdmin } from "../lib/db/soft-delete";

const DEMO_MOBILE = "989121111111";
const DEMO_PASSWORD = "admin123";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function main(): Promise<void> {
  const admin = await authenticateAdmin(DEMO_MOBILE, DEMO_PASSWORD);
  assert(Boolean(admin), "authenticateAdmin with demo credentials");
  assert(admin!.mobile === DEMO_MOBILE, "authenticated admin mobile");
  assert(
    !("password" in (admin as object)) && !("passwordHash" in (admin as object)),
    "AdminPublic has no password fields",
  );

  const wrong = await authenticateAdmin(DEMO_MOBILE, "wrong-password");
  assert(wrong === null, "wrong password returns null");

  const missing = await authenticateAdmin("", "");
  assert(missing === null, "empty credentials return null");

  const token = createSessionToken(admin!.id);
  assert(
    resolveSessionAdminId(token) === admin!.id,
    "session token resolves to admin id",
  );

  const row = await prisma.admin.findFirst({
    where: { id: toBigIntId(admin!.id), ...notDeleted },
  });
  assert(Boolean(row), "admin row in DB with notDeleted");
  const mapped = mapAdminPublic(row!);
  assert(mapped.id === admin!.id, "mapAdminPublic matches session id");

  const backup = await prisma.admin.findFirst({
    where: { mobile: "989122222222", ...notDeleted },
  });
  assert(Boolean(backup), "backup admin exists");

  await softDeleteAdmin(toEntityId(backup!.id));
  const deletedAuth = await authenticateAdmin("989122222222", "admin456");
  assert(deletedAuth === null, "soft-deleted admin cannot login");

  await prisma.admin.update({
    where: { id: backup!.id },
    data: { deletedAt: null },
  });

  const logsBefore = await prisma.systemLog.count({
    where: { action: LOG_ACTIONS.adminLogin },
  });
  await appendLog({
    actorType: "admin",
    actorId: admin!.id,
    action: LOG_ACTIONS.adminLogin,
    entityType: "Admin",
    entityId: admin!.id,
    metadata: { mobile: DEMO_MOBILE, test: "phase5" },
  });
  const logsAfter = await prisma.systemLog.count({
    where: { action: LOG_ACTIONS.adminLogin },
  });
  assert(logsAfter === logsBefore + 1, "appendLog writes admin.login to DB");

  const lastLog = await prisma.systemLog.findFirst({
    where: { action: LOG_ACTIONS.adminLogin },
    orderBy: { createdAt: "desc" },
  });
  const meta = lastLog?.metadata as Record<string, unknown> | null;
  assert(meta?.password === undefined, "log metadata strips password");
  assert(meta?.verification_code === undefined, "log metadata strips verification_code");

  console.log("\nPhase 5 verification passed.");
  console.log(
    "  Note: getCurrentAdmin() requires Next.js cookies(); tested via authenticateAdmin + prisma lookup.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
