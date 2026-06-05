import { hashPassword } from "../../lib/auth/password";
import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../lib/generated/prisma/client";
import {
  ADMIN_SEEDS,
  BANK_ACCOUNT_SEEDS,
  COUNTRIES,
  CURRENCY_SEEDS,
  LOG_ACTIONS,
  REQUEST_SEEDS,
  USER_SEEDS,
} from "./data";
import { clearSeedData, daysAgoDate } from "./helpers";

type IdMap = Map<string, bigint>;

async function seedCountries(): Promise<IdMap> {
  const now = new Date();
  await prisma.country.createMany({
    data: COUNTRIES.map((c) => ({
      code: c.code,
      nameFa: c.name_fa,
      nameEn: c.name_en,
      phonePrefix: c.phone_prefix,
      createdAt: now,
      updatedAt: now,
    })),
  });
  const rows = await prisma.country.findMany();
  return new Map(rows.map((r) => [r.code, r.id]));
}

async function seedAdmins(): Promise<IdMap> {
  const map: IdMap = new Map();
  const now = new Date();
  for (const a of ADMIN_SEEDS) {
    const row = await prisma.admin.create({
      data: {
        name: a.name,
        mobile: a.mobile,
        passwordHash: await hashPassword(a.password),
        createdAt: daysAgoDate(a.daysAgoCreated),
        updatedAt: now,
      },
    });
    map.set(a.mobile, row.id);
  }
  return map;
}

async function seedUsers(): Promise<IdMap> {
  const map: IdMap = new Map();
  const now = new Date();
  for (const u of USER_SEEDS) {
    const row = await prisma.user.create({
      data: {
        name: u.name,
        telegramChatId: u.telegramChatId,
        telegramUsername: u.telegramUsername,
        mobile: u.mobile,
        verificationCode: u.verificationCode,
        notes: u.notes,
        createdAt: daysAgoDate(u.daysAgoCreated),
        updatedAt: now,
      },
    });
    map.set(u.mobile, row.id);
  }
  return map;
}

async function seedCurrencies(countryIds: IdMap): Promise<IdMap> {
  const map: IdMap = new Map();
  const now = new Date();
  for (const c of CURRENCY_SEEDS) {
    const countryId = countryIds.get(c.countryCode);
    if (!countryId) {
      throw new Error(`Country not found: ${c.countryCode}`);
    }
    const row = await prisma.currency.create({
      data: {
        title: c.title,
        slug: c.slug,
        countryId,
        isActive: true,
        sortOrder: c.sortOrder,
        createdAt: daysAgoDate(50),
        updatedAt: now,
      },
    });
    map.set(c.slug, row.id);
  }
  return map;
}

async function seedBankAccounts(
  userIds: IdMap,
  currencyIds: IdMap,
): Promise<void> {
  for (const a of BANK_ACCOUNT_SEEDS) {
    const userId = userIds.get(a.userMobile);
    const currencyId = currencyIds.get(a.currencySlug);
    if (!userId || !currencyId) {
      throw new Error(`Bank account FK missing: ${a.userMobile} / ${a.currencySlug}`);
    }
    await prisma.userBankAccount.create({
      data: {
        userId,
        currencyId,
        accountNumber: a.accountNumber,
        label: a.label,
        createdAt: daysAgoDate(a.daysAgoCreated),
      },
    });
  }
}

async function seedRequests(
  userIds: IdMap,
  currencyIds: IdMap,
  primaryAdminId: bigint,
): Promise<Map<string, bigint>> {
  const map = new Map<string, bigint>();
  const now = new Date();
  for (const s of REQUEST_SEEDS) {
    const userId = userIds.get(s.userMobile);
    const sourceCurrencyId = currencyIds.get(s.sourceSlug);
    const targetCurrencyId = currencyIds.get(s.targetSlug);
    if (!userId || !sourceCurrencyId || !targetCurrencyId) {
      throw new Error(`Request FK missing: ${s.trackingCode}`);
    }
    const createdAt = daysAgoDate(s.daysAgo);
    const reviewed = s.reviewed === true;
    const row = await prisma.exchangeRequest.create({
      data: {
        trackingCode: s.trackingCode,
        userId,
        sourceCurrencyId,
        targetCurrencyId,
        amount: s.amount,
        bankAccount: s.bankAccount,
        invoiceImageUrl: s.invoice,
        status: s.status,
        rejectionReason: s.rejectionReason ?? null,
        reviewedById: reviewed ? primaryAdminId : null,
        reviewedAt: reviewed ? createdAt : null,
        createdAt,
        updatedAt: now,
      },
    });
    map.set(s.trackingCode, row.id);
  }
  return map;
}

async function seedLogs(adminIds: IdMap, userIds: IdMap): Promise<number> {
  const primaryAdminId = adminIds.get("989121111111")!;
  const userIdByMobile = userIds;
  const logs: Prisma.SystemLogCreateManyInput[] = [];

  const push = (entry: {
    actorType: "admin" | "user" | "system";
    actorId: bigint | null;
    action: string;
    entityType: string;
    entityId: bigint | null;
    metadata?: Record<string, unknown>;
    daysAgo: number;
  }) => {
    logs.push({
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      createdAt: daysAgoDate(entry.daysAgo),
    });
  };

  push({
    actorType: "admin",
    actorId: primaryAdminId,
    action: LOG_ACTIONS.adminLogin,
    entityType: "Admin",
    entityId: primaryAdminId,
    metadata: { ip: "127.0.0.1" },
    daysAgo: 0,
  });

  const manualUserId = userIdByMobile.get("989121000008");
  if (manualUserId) {
    push({
      actorType: "admin",
      actorId: primaryAdminId,
      action: LOG_ACTIONS.userCreate,
      entityType: "User",
      entityId: manualUserId,
      metadata: { mobile: "989121000008" },
      daysAgo: 15,
    });
  }

  const firstUserId = userIdByMobile.get("989121000001");
  if (firstUserId) {
    push({
      actorType: "user",
      actorId: firstUserId,
      action: LOG_ACTIONS.botAuthSuccess,
      entityType: "User",
      entityId: firstUserId,
      metadata: { method: "mobile+code" },
      daysAgo: 30,
    });
  }

  const requestRows = await prisma.exchangeRequest.findMany({
    select: {
      id: true,
      trackingCode: true,
      status: true,
      userId: true,
      amount: true,
      rejectionReason: true,
    },
  });

  const approved = requestRows.filter((r) => r.status === "approved");
  const rejected = requestRows.filter((r) => r.status === "rejected");
  const pending = requestRows.filter((r) => r.status === "pending");

  approved.forEach((r, i) => {
    push({
      actorType: "admin",
      actorId: primaryAdminId,
      action: LOG_ACTIONS.requestApprove,
      entityType: "ExchangeRequest",
      entityId: r.id,
      metadata: { trackingCode: r.trackingCode },
      daysAgo: 10 + i,
    });
  });

  rejected.forEach((r, i) => {
    push({
      actorType: "admin",
      actorId: primaryAdminId,
      action: LOG_ACTIONS.requestReject,
      entityType: "ExchangeRequest",
      entityId: r.id,
      metadata: {
        trackingCode: r.trackingCode,
        reasonSummary: r.rejectionReason?.slice(0, 40),
      },
      daysAgo: 8 + i,
    });
  });

  pending.forEach((r, i) => {
    push({
      actorType: "user",
      actorId: r.userId,
      action: LOG_ACTIONS.botRequestCreate,
      entityType: "ExchangeRequest",
      entityId: r.id,
      metadata: { trackingCode: r.trackingCode, amount: Number(r.amount) },
      daysAgo: 1 + i,
    });
  });

  const extraActions = [
    LOG_ACTIONS.adminCreate,
    LOG_ACTIONS.currencyUpdate,
    LOG_ACTIONS.userUpdate,
    LOG_ACTIONS.botStart,
    LOG_ACTIONS.botAuthFail,
    LOG_ACTIONS.adminLogout,
  ] as const;

  const userMobiles = [...userIdByMobile.keys()];

  for (let i = logs.length; i < 50; i++) {
    const day = (i % 28) + 1;
    const isAdmin = i % 3 === 0;
    const isSystem = i % 7 === 0;
    const mobile = userMobiles[i % userMobiles.length]!;
    push({
      actorType: isSystem ? "system" : isAdmin ? "admin" : "user",
      actorId: isSystem
        ? null
        : isAdmin
          ? primaryAdminId
          : userIdByMobile.get(mobile)!,
      action: extraActions[i % extraActions.length] ?? LOG_ACTIONS.userUpdate,
      entityType: isAdmin ? "Admin" : "User",
      entityId: isAdmin ? primaryAdminId : userIdByMobile.get(mobile)!,
      metadata: { index: i, source: "seed" },
      daysAgo: day,
    });
  }

  await prisma.systemLog.createMany({ data: logs });
  return logs.length;
}

export async function runSeed(): Promise<void> {
  console.log("Seeding database (PRD §12 + mock seed)…");
  await clearSeedData(prisma);

  const countryIds = await seedCountries();
  const adminIds = await seedAdmins();
  const userIds = await seedUsers();
  const currencyIds = await seedCurrencies(countryIds);
  await seedBankAccounts(userIds, currencyIds);

  const primaryAdminId = adminIds.get("989121111111")!;
  await seedRequests(userIds, currencyIds, primaryAdminId);
  const logCount = await seedLogs(adminIds, userIds);

  const [countries, admins, users, currencies, requests, bankAccounts, systemLogs] =
    await Promise.all([
      prisma.country.count(),
      prisma.admin.count(),
      prisma.user.count(),
      prisma.currency.count(),
      prisma.exchangeRequest.count(),
      prisma.userBankAccount.count(),
      prisma.systemLog.count(),
    ]);

  const activeUsers = await prisma.user.count({
    where: { verificationCode: { not: null }, deletedAt: null },
  });
  const inactiveUsers = await prisma.user.count({
    where: { verificationCode: null, deletedAt: null },
  });
  const pending = await prisma.exchangeRequest.count({
    where: { status: "pending" },
  });

  console.log("Seed complete:");
  console.log(`  countries: ${countries}`);
  console.log(`  admins: ${admins}`);
  console.log(`  users: ${users} (active: ${activeUsers}, inactive: ${inactiveUsers})`);
  console.log(`  currencies: ${currencies}`);
  console.log(`  bank accounts: ${bankAccounts}`);
  console.log(`  requests: ${requests} (pending: ${pending})`);
  console.log(`  system logs: ${systemLogs} (inserted batch: ${logCount})`);
  console.log("  demo login: 989121111111 / admin123");
}
