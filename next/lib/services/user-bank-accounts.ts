import { mapUserBankAccount } from "@/lib/db/mappers";
import { toBigIntId, toEntityId } from "@/lib/db/serialize";
import { prisma } from "@/lib/prisma";
import type { EntityId, UserBankAccount } from "@/lib/types";
import { toEnglishDigits } from "@/lib/utils/persian-digits";

export function normalizeAccountNumber(raw: string): string {
  return toEnglishDigits(raw.trim()).replace(/[\s\-]/g, "");
}

export async function listBankAccountsForUser(
  userId: EntityId,
  targetCurrencyId: EntityId,
): Promise<UserBankAccount[]> {
  const rows = await prisma.userBankAccount.findMany({
    where: {
      userId: toBigIntId(userId),
      currencyId: toBigIntId(targetCurrencyId),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapUserBankAccount);
}

export async function saveBankAccountIfNew(
  userId: EntityId,
  targetCurrencyId: EntityId,
  accountNumberRaw: string,
  label?: string | null,
): Promise<UserBankAccount> {
  const accountNumber = normalizeAccountNumber(accountNumberRaw);
  if (!accountNumber) {
    throw new BankAccountServiceError("invalid_account", "شماره حساب نامعتبر است", 400);
  }

  const existing = await prisma.userBankAccount.findFirst({
    where: {
      userId: toBigIntId(userId),
      currencyId: toBigIntId(targetCurrencyId),
      accountNumber,
    },
  });

  if (existing) {
    return mapUserBankAccount(existing);
  }

  const row = await prisma.userBankAccount.create({
    data: {
      userId: toBigIntId(userId),
      currencyId: toBigIntId(targetCurrencyId),
      accountNumber,
      label: label?.trim() || null,
    },
  });

  return mapUserBankAccount(row);
}

export class BankAccountServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BankAccountServiceError";
  }
}
