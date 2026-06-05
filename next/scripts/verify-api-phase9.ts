/**
 * Phase 9 — system logging: appendLog → MySQL, sanitize metadata, action catalog.
 * Run: pnpm run verify:api:phase9
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { appendLog } from "../lib/logging/append-log";
import {
  LOG_ACTIONS,
  PANEL_LOG_ACTIONS,
  isKnownLogAction,
} from "../lib/logging/actions";
import {
  LOG_METADATA_MAX_STRING,
  sanitizeLogMetadata,
} from "../lib/logging/sanitize-metadata";
import { notDeleted } from "../lib/db/soft-delete";
import { toBigIntId, toEntityId } from "../lib/db/serialize";
import { prisma } from "../lib/prisma";
import { createUser, deleteUser } from "../lib/services/users";
import { listLogs } from "../lib/services/logs";
import {
  approveRequest,
  listRequests,
} from "../lib/services/requests";

const TEST_USER_MOBILE = "989129999009";
const LONG_NOTE = "x".repeat(300);

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

function assertNoVoidAppendLogInServices(): void {
  const root = join(import.meta.dirname, "..");
  const dirs = ["lib/services", "app/api"];
  for (const dir of dirs) {
    const base = join(root, dir);
    for (const file of walkTsFiles(base)) {
      const text = readFileSync(file, "utf8");
      if (text.includes("void appendLog")) {
        throw new Error(`${file} uses void appendLog — must await`);
      }
    }
  }
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsFiles(path));
    else if (entry.name.endsWith(".ts")) out.push(path);
  }
  return out;
}

async function cleanupTestUser(): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { mobile: TEST_USER_MOBILE },
  });
  if (!user) return;
  await prisma.userBankAccount.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
  await prisma.systemLog.deleteMany({
    where: { entityType: "User", entityId: user.id },
  });
}

async function main(): Promise<void> {
  assertNoVoidAppendLogInServices();
  assert(
    PANEL_LOG_ACTIONS.every((a) => isKnownLogAction(a)),
    "panel action catalog valid",
  );

  const sanitized = sanitizeLogMetadata({
    password: "secret",
    verificationCode: "ABC123",
    ip: "192.168.1.1",
    note: LONG_NOTE,
    hasCode: true,
  });
  assert(sanitized?.password === undefined, "strips password");
  assert(sanitized?.verificationCode === undefined, "strips verificationCode");
  assert(sanitized?.ip === "192.168.1.1", "keeps ip");
  assert(sanitized?.hasCode === true, "keeps hasCode");
  const note = sanitized?.note as string;
  assert(
    typeof note === "string" && note.length <= LOG_METADATA_MAX_STRING + 1,
    "truncates long strings",
  );

  const actorId = await getActorId();
  await cleanupTestUser();

  const beforeApprove = await prisma.systemLog.count({
    where: { action: LOG_ACTIONS.requestApprove },
  });

  const pending = await listRequests({ status: ["pending"], pageSize: 1 });
  const toApprove = pending.items[0];
  if (!toApprove) throw new Error("no pending request in seed");

  const snap = await prisma.exchangeRequest.findUnique({
    where: { id: toBigIntId(toApprove.id) },
  });
  if (!snap) throw new Error("request row missing");

  await approveRequest(toApprove.id, actorId);

  const afterApprove = await prisma.systemLog.count({
    where: { action: LOG_ACTIONS.requestApprove },
  });
  assert(afterApprove === beforeApprove + 1, "approve writes request.approve log");

  const approveLog = await prisma.systemLog.findFirst({
    where: {
      action: LOG_ACTIONS.requestApprove,
      entityId: toBigIntId(toApprove.id),
    },
    orderBy: { createdAt: "desc" },
  });
  assert(Boolean(approveLog), "approve log linked to entity");
  const approveMeta = approveLog?.metadata as Record<string, unknown> | null;
  assert(
    approveMeta?.trackingCode === toApprove.trackingCode,
    "approve metadata has trackingCode",
  );

  await prisma.exchangeRequest.update({
    where: { id: snap.id },
    data: {
      status: snap.status,
      reviewedById: snap.reviewedById,
      reviewedAt: snap.reviewedAt,
      rejectionReason: snap.rejectionReason,
    },
  });
  if (approveLog) {
    await prisma.systemLog.delete({ where: { id: approveLog.id } });
  }

  const user = await createUser(
    {
      name: "لاگ تست",
      mobile: TEST_USER_MOBILE,
      verificationCode: "SECRET99",
    },
    actorId,
  );

  const createLog = await prisma.systemLog.findFirst({
    where: {
      action: LOG_ACTIONS.userCreate,
      entityId: toBigIntId(user.id),
    },
    orderBy: { createdAt: "desc" },
  });
  const createMeta = createLog?.metadata as Record<string, unknown> | null;
  assert(createMeta?.verificationCode === undefined, "user.create no full code");
  assert(createMeta?.verification_code === undefined, "user.create no code key");
  assert(createMeta?.hasCode === true, "user.create hasCode true");
  assert(createMeta?.password === undefined, "user.create no password");

  const filtered = await listLogs({
    action: LOG_ACTIONS.userCreate,
    pageSize: 5,
  });
  assert(
    filtered.items.some((l) => l.entityId === user.id),
    "listLogs filters by action",
  );

  await deleteUser(user.id, actorId);
  await cleanupTestUser();

  const direct = await appendLog({
    actorType: "system",
    action: LOG_ACTIONS.adminLogin,
    entityType: "Admin",
    entityId: actorId,
    metadata: {
      password: "x",
      verification_code: "y",
      mobile: "989121111111",
    },
  });
  assert(direct.metadata?.password === undefined, "appendLog sanitizes on insert");

  console.log("\nPhase 9 verification passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
