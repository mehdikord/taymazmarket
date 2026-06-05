import type {
  Admin as AdminRow,
  Country as CountryRow,
  Currency as CurrencyRow,
  ExchangeRequest as ExchangeRequestRow,
  SystemLog as SystemLogRow,
  User as UserRow,
  UserBankAccount as UserBankAccountRow,
} from "@/lib/generated/prisma/client";
import type {
  AdminPublic,
  Country,
  Currency,
  ExchangeRequest,
  ExchangeRequestStatus,
  LogActorType,
  SystemLog,
  User,
  UserBankAccount,
} from "@/lib/types";
import {
  decimalToNumber,
  jsonToMetadata,
  telegramChatIdToString,
  toEntityId,
  toIsoString,
} from "./serialize";

export function mapCountry(row: CountryRow): Country {
  return {
    id: toEntityId(row.id),
    code: row.code,
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    phonePrefix: row.phonePrefix,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function mapAdminPublic(row: AdminRow): AdminPublic {
  return {
    id: toEntityId(row.id),
    name: row.name,
    mobile: row.mobile,
    deletedAt: row.deletedAt ? toIsoString(row.deletedAt) : null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function mapUser(row: UserRow): User {
  return {
    id: toEntityId(row.id),
    name: row.name,
    telegramChatId: telegramChatIdToString(row.telegramChatId),
    telegramUsername: row.telegramUsername,
    mobile: row.mobile,
    profileImageUrl: row.profileImageUrl,
    verificationCode: row.verificationCode,
    notes: row.notes,
    deletedAt: row.deletedAt ? toIsoString(row.deletedAt) : null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function mapCurrency(row: CurrencyRow): Currency {
  return {
    id: toEntityId(row.id),
    title: row.title,
    slug: row.slug,
    countryId: toEntityId(row.countryId),
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function mapUserBankAccount(row: UserBankAccountRow): UserBankAccount {
  return {
    id: toEntityId(row.id),
    userId: toEntityId(row.userId),
    currencyId: toEntityId(row.currencyId),
    accountNumber: row.accountNumber,
    label: row.label,
    createdAt: toIsoString(row.createdAt),
  };
}

export function mapExchangeRequest(row: ExchangeRequestRow): ExchangeRequest {
  return {
    id: toEntityId(row.id),
    trackingCode: row.trackingCode,
    userId: toEntityId(row.userId),
    sourceCurrencyId: toEntityId(row.sourceCurrencyId),
    targetCurrencyId: toEntityId(row.targetCurrencyId),
    amount: decimalToNumber(row.amount),
    bankAccount: row.bankAccount,
    invoiceImageUrl: row.invoiceImageUrl,
    status: row.status as ExchangeRequestStatus,
    rejectionReason: row.rejectionReason,
    reviewedById: row.reviewedById != null ? toEntityId(row.reviewedById) : null,
    reviewedAt: row.reviewedAt ? toIsoString(row.reviewedAt) : null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function mapSystemLog(row: SystemLogRow): SystemLog {
  return {
    id: toEntityId(row.id),
    actorType: row.actorType as LogActorType,
    actorId: row.actorId != null ? toEntityId(row.actorId) : null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId != null ? toEntityId(row.entityId) : null,
    metadata: jsonToMetadata(row.metadata),
    createdAt: toIsoString(row.createdAt),
  };
}
