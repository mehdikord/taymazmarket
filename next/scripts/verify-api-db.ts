/**
 * End-to-end API + DB verification (CI-friendly).
 * Run: pnpm run verify:api
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { authenticateAdmin } from "../lib/auth/authenticate-admin";
import { notDeleted } from "../lib/db/soft-delete";
import { toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import { listAdmins } from "../lib/services/admins";
import { listCurrencies } from "../lib/services/currencies";
import { listLogs } from "../lib/services/logs";
import {
  approveRequest,
  listRequests,
  rejectRequest,
} from "../lib/services/requests";
import { listUsers } from "../lib/services/users";
import { resetDevDatabase } from "../lib/dev/reset-database";
import { getDashboardStats } from "../lib/stats/dashboard";

const root = resolve(import.meta.dirname, "..");
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
  console.log("→ preflight: db:seed");
  execSync("pnpm run db:seed", { cwd: root, stdio: "inherit" });

  await prisma.$queryRaw`SELECT 1`;
  assert(true, "prisma connected");

  const admin = await authenticateAdmin(DEMO_MOBILE, DEMO_PASSWORD);
  assert(Boolean(admin), "admin login (seed credentials)");
  const actorId = admin!.id;

  const admins = await listAdmins();
  assert(admins.length >= 2, "GET admins (service)");

  const users = await listUsers({ pageSize: 20 });
  assert(users.total === 10, "GET users (service)");

  const currencies = await listCurrencies();
  assert(currencies.length === 4, "GET currencies (service)");

  const pending = await listRequests({ status: ["pending"], pageSize: 50 });
  assert(pending.total === 5, "GET requests pending");

  const logs = await listLogs({ pageSize: 10 });
  assert(logs.total >= 50, "GET logs");

  const stats = await getDashboardStats();
  assert(stats.pendingRequests === 5, "GET stats/dashboard");
  assert(stats.totalRequests === 15, "stats total requests");

  const toApprove = pending.items[0]!;
  const snap = await prisma.exchangeRequest.findUniqueOrThrow({
    where: { id: BigInt(toApprove.id) },
  });

  await approveRequest(toApprove.id, actorId);
  assert(
    (await listRequests({ status: ["pending"], pageSize: 50 })).total === 4,
    "approve reduces pending",
  );

  const nextPending = (await listRequests({ status: ["pending"], pageSize: 1 }))
    .items[0];
  if (nextPending) {
    await rejectRequest(nextPending.id, "verify-api smoke", actorId);
    const rejected = await listRequests({
      status: ["rejected"],
      trackingCode: nextPending.trackingCode,
    });
    assert(rejected.items[0]?.rejectionReason === "verify-api smoke", "reject");
  }

  await prisma.exchangeRequest.update({
    where: { id: snap.id },
    data: {
      status: snap.status,
      reviewedById: snap.reviewedById,
      reviewedAt: snap.reviewedAt,
      rejectionReason: snap.rejectionReason,
    },
  });

  const adminRow = await prisma.admin.findFirst({
    where: { id: BigInt(actorId), ...notDeleted },
    select: { passwordHash: true, mobile: true },
  });
  assert(Boolean(adminRow?.passwordHash), "password stored as hash");
  assert(
    !adminRow!.passwordHash.includes("admin123"),
    "API never stores plaintext password",
  );

  await resetDevDatabase();

  console.log("\n✓ verify:api passed (MySQL + services)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
