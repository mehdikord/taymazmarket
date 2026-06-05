/**
 * فاز ۲ — سرویس‌های bot-auth, bank-accounts, bot-requests
 */
import "dotenv/config";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { prisma } from "../lib/prisma";
import {
  findUserByTelegramChatId,
  submitPhoneForAuth,
  submitVerificationCode,
} from "../lib/services/bot-auth";
import {
  listBankAccountsForUser,
  normalizeAccountNumber,
  saveBankAccountIfNew,
} from "../lib/services/user-bank-accounts";
import {
  createRequestFromBot,
  listUserRequests,
} from "../lib/services/bot-requests";

const TEST_CHAT_ID = "999999001";
const TEST_MOBILE_NEW = "989129999001";
const SEED_MOBILE = "989121000001";
const SEED_CODE = "A1B2C3";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

async function cleanupTestUser(): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { mobile: TEST_MOBILE_NEW },
  });
  if (!user) return;

  await prisma.exchangeRequest.deleteMany({ where: { userId: user.id } });
  await prisma.userBankAccount.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

async function main(): Promise<void> {
  await cleanupTestUser();

  const invalid = await submitPhoneForAuth(
    { chatId: TEST_CHAT_ID, username: "bot_test" },
    "not-a-phone",
  );
  assert(invalid.type === "invalid_phone", "invalid phone rejected");

  const created = await submitPhoneForAuth(
    { chatId: TEST_CHAT_ID, username: "bot_test", name: "Bot Test" },
    TEST_MOBILE_NEW,
  );
  assert(created.type === "created_inactive", "new user created inactive");

  const seedUser = await prisma.user.findFirst({
    where: { mobile: SEED_MOBILE, deletedAt: null },
  });
  assert(seedUser != null, "seed user 989121000001 exists");

  const seedChatId = BigInt(888888001);
  await prisma.user.update({
    where: { id: seedUser.id },
    data: { telegramChatId: seedChatId },
  });

  const codeResult = await submitVerificationCode(seedChatId, SEED_CODE);
  assert(codeResult.type === "success", "seed verification code accepted");

  const byChat = await findUserByTelegramChatId(seedChatId);
  assert(byChat?.id != null, "findUserByTelegramChatId works");

  const lira = await prisma.currency.findFirst({ where: { slug: "lira" } });
  const rials = await prisma.currency.findFirst({ where: { slug: "rials" } });
  assert(lira != null && rials != null, "currencies exist");

  const accounts = await listBankAccountsForUser(
    Number(seedUser.id),
    Number(rials.id),
  );
  assert(accounts.length >= 1, "bank accounts for seed user + rials");

  const normalized = normalizeAccountNumber("۶۰۳۷-۹۹۱۲");
  assert(normalized.length > 0, "account normalize");

  const saved = await saveBankAccountIfNew(
    Number(seedUser.id),
    Number(rials.id),
    "6037991234567890",
  );
  assert(saved.accountNumber === "6037991234567890", "save or return existing");

  const request = await createRequestFromBot({
    userId: Number(seedUser.id),
    sourceCurrencyId: Number(lira.id),
    targetCurrencyId: Number(rials.id),
    amount: 1000,
    bankAccount: "6037991234567890",
    invoiceImageUrl: "/mock-invoices/verify-bot.jpg",
  });
  assert(request.trackingCode.length === 8, "tracking code 8 digits");
  assert(request.status === "pending", "request pending");

  const list = await listUserRequests(Number(seedUser.id), { page: 1 });
  assert(list.items.length >= 1, "list user requests");
  assert(
    list.items.some((i) => i.trackingCode === request.trackingCode),
    "created request in list",
  );

  const dup = await createRequestFromBot({
    userId: Number(seedUser.id),
    sourceCurrencyId: Number(lira.id),
    targetCurrencyId: Number(lira.id),
    amount: 1,
    bankAccount: "x",
    invoiceImageUrl: "/x.jpg",
  }).catch((e) => e);
  assert(
    dup instanceof Error && dup.message.includes("یکسان"),
    "same currency rejected",
  );

  await prisma.exchangeRequest.delete({ where: { id: BigInt(request.id) } });
  await prisma.user.update({
    where: { id: seedUser.id },
    data: { telegramChatId: BigInt(100001) },
  });
  await cleanupTestUser();

  console.info("verify-bot-phase2: all checks passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
