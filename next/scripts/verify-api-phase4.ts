/**
 * Phase 4 — DB utilities: serialize, mappers, soft-delete, dates, decimal.
 * Run: pnpm run verify:api:phase4
 */
import "dotenv/config";
import { existsSync } from "fs";
import { resolve } from "path";
import {
  createdAtRange,
  createdAtWhere,
  decimalFromNumber,
  decimalToNumber,
  mapAdminPublic,
  mapCountry,
  mapCurrency,
  mapExchangeRequest,
  mapSystemLog,
  mapUser,
  mapUserBankAccount,
  notDeleted,
  telegramChatIdFromString,
  telegramChatIdToString,
  toBigIntId,
  toEntityId,
} from "../lib/db";
import { getPrismaClient, prisma } from "../lib/prisma";
import { Prisma } from "../lib/generated/prisma/client";

const root = resolve(import.meta.dirname, "..");

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`OK: ${message}`);
}

async function main(): Promise<void> {
  for (const file of [
    "lib/db/serialize.ts",
    "lib/db/mappers.ts",
    "lib/db/soft-delete.ts",
    "lib/db/dates.ts",
    "lib/db/index.ts",
  ]) {
    assert(existsSync(resolve(root, file)), `${file} exists`);
  }

  assert(toEntityId(1n) === 1, "toEntityId");
  assert(toBigIntId(42) === 42n, "toBigIntId");
  assert(telegramChatIdToString(100001n) === "100001", "telegramChatIdToString");
  assert(telegramChatIdFromString("100002") === 100002n, "telegramChatIdFromString");

  const d = decimalFromNumber(1500.5);
  assert(d instanceof Prisma.Decimal, "decimalFromNumber returns Prisma.Decimal");
  assert(decimalToNumber(d) === 1500.5, "decimal roundtrip 1500.5");

  const range = createdAtRange("2025-01-01", "2025-01-31");
  assert(range?.gte instanceof Date, "createdAtRange gte");
  assert(range?.lte instanceof Date, "createdAtRange lte");
  assert(createdAtWhere().createdAt === undefined, "createdAtWhere empty");

  assert(notDeleted.deletedAt === null, "notDeleted constant");

  const clientA = getPrismaClient();
  const clientB = getPrismaClient();
  assert(clientA === clientB, "getPrismaClient returns singleton");

  const country = await prisma.country.findFirst({ where: { code: "IR" } });
  assert(Boolean(country), "seed country IR");
  const mappedCountry = mapCountry(country!);
  JSON.stringify(mappedCountry);
  assert(mappedCountry.code === "IR", "mapCountry");

  const admin = await prisma.admin.findFirst({
    where: { mobile: "989121111111", ...notDeleted },
  });
  assert(Boolean(admin), "demo admin with notDeleted");
  const mappedAdmin = mapAdminPublic(admin!);
  const adminJson = JSON.stringify(mappedAdmin);
  assert(!adminJson.includes("password"), "mapAdminPublic omits password");
  assert(mappedAdmin.mobile === "989121111111", "mapAdminPublic");

  const user = await prisma.user.findFirst({
    where: { mobile: "989121000001", ...notDeleted },
  });
  assert(Boolean(user), "seed user");
  const mappedUser = mapUser(user!);
  JSON.stringify(mappedUser);
  assert(mappedUser.telegramChatId === "100001", "mapUser telegramChatId string");

  const currency = await prisma.currency.findFirst({ where: { slug: "rials" } });
  assert(Boolean(currency), "seed currency");
  JSON.stringify(mapCurrency(currency!));

  const request = await prisma.exchangeRequest.findFirst({
    where: { trackingCode: "12345601" },
  });
  assert(Boolean(request), "seed request");
  const mappedRequest = mapExchangeRequest(request!);
  JSON.stringify(mappedRequest);
  assert(typeof mappedRequest.amount === "number", "mapExchangeRequest amount is number");
  assert(mappedRequest.amount > 0, "request amount positive");

  const bank = await prisma.userBankAccount.findFirst();
  assert(Boolean(bank), "seed bank account");
  JSON.stringify(mapUserBankAccount(bank!));

  const log = await prisma.systemLog.findFirst();
  assert(Boolean(log), "seed log");
  JSON.stringify(mapSystemLog(log!));

  const testAmount = 1500.5;
  const created = await prisma.exchangeRequest.create({
    data: {
      trackingCode: "99999999",
      userId: user!.id,
      sourceCurrencyId: currency!.id,
      targetCurrencyId: currency!.id,
      amount: decimalFromNumber(testAmount),
      bankAccount: "0000000000000000",
      invoiceImageUrl: "/mock-invoices/1.jpg",
      status: "pending",
    },
  });
  const readBack = decimalToNumber(created.amount);
  assert(readBack === testAmount, "DB decimal 1500.5 roundtrip");
  await prisma.exchangeRequest.delete({ where: { id: created.id } });

  const usersInRange = await prisma.user.count({
    where: {
      ...notDeleted,
      ...createdAtWhere("1970-01-01", "2099-12-31"),
    },
  });
  assert(usersInRange >= 10, "createdAtWhere includes seeded users");

  console.log("\nPhase 4 verification passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
