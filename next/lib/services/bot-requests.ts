import { mapExchangeRequest } from "@/lib/db/mappers";
import { decimalFromNumber, toBigIntId, toEntityId } from "@/lib/db/serialize";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { prisma } from "@/lib/prisma";
import type { EntityId, ExchangeRequest, ExchangeRequestStatus } from "@/lib/types";
import { generateTrackingCode } from "@/lib/services/tracking-code";
import type { Prisma } from "@/lib/generated/prisma/client";

export type CreateBotRequestDto = {
  userId: EntityId;
  sourceCurrencyId: EntityId;
  targetCurrencyId: EntityId;
  amount: number;
  bankAccount: string;
  invoiceImageUrl: string;
};

export type BotRequestListItem = {
  id: EntityId;
  trackingCode: string;
  status: ExchangeRequestStatus;
  amount: number;
  bankAccount: string;
  createdAt: string;
  sourceTitle: string;
  targetTitle: string;
  rejectionReason: string | null;
};

export type BotRequestDetail = BotRequestListItem & {
  invoiceImageUrl: string;
  reviewedAt: string | null;
};

const requestListInclude = {
  sourceCurrency: { select: { title: true } },
  targetCurrency: { select: { title: true } },
} satisfies Prisma.ExchangeRequestInclude;

type RequestRow = Prisma.ExchangeRequestGetPayload<{
  include: typeof requestListInclude;
}>;

function mapListItem(row: RequestRow): BotRequestListItem {
  const base = mapExchangeRequest(row);
  return {
    id: base.id,
    trackingCode: base.trackingCode,
    status: base.status,
    amount: base.amount,
    bankAccount: base.bankAccount,
    createdAt: base.createdAt,
    sourceTitle: row.sourceCurrency.title,
    targetTitle: row.targetCurrency.title,
    rejectionReason: base.rejectionReason,
  };
}

function mapDetail(row: RequestRow): BotRequestDetail {
  const base = mapExchangeRequest(row);
  return {
    ...mapListItem(row),
    invoiceImageUrl: base.invoiceImageUrl,
    reviewedAt: base.reviewedAt,
  };
}

async function assertCurrenciesForRequest(
  sourceCurrencyId: EntityId,
  targetCurrencyId: EntityId,
): Promise<void> {
  if (sourceCurrencyId === targetCurrencyId) {
    throw new BotRequestServiceError(
      "same_currency",
      "ارز مبدا و مقصد نمی‌توانند یکسان باشند",
      400,
    );
  }

  const ids = [sourceCurrencyId, targetCurrencyId].map(toBigIntId);
  const currencies = await prisma.currency.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true },
  });

  if (currencies.length !== 2) {
    throw new BotRequestServiceError(
      "invalid_currency",
      "ارز انتخاب‌شده معتبر یا فعال نیست",
      400,
    );
  }
}

export async function createRequestFromBot(
  dto: CreateBotRequestDto,
): Promise<ExchangeRequest> {
  if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
    throw new BotRequestServiceError("invalid_amount", "مبلغ نامعتبر است", 400);
  }

  const bankAccount = dto.bankAccount.trim();
  const invoiceImageUrl = dto.invoiceImageUrl.trim();

  if (!bankAccount || !invoiceImageUrl) {
    throw new BotRequestServiceError(
      "invalid_payload",
      "حساب بانکی و فاکتور الزامی است",
      400,
    );
  }

  await assertCurrenciesForRequest(dto.sourceCurrencyId, dto.targetCurrencyId);

  const user = await prisma.user.findFirst({
    where: { id: toBigIntId(dto.userId), deletedAt: null },
    select: { id: true, verificationCode: true },
  });

  if (!user?.verificationCode) {
    throw new BotRequestServiceError("user_inactive", "کاربر احراز نشده است", 403);
  }

  const trackingCode = await generateTrackingCode();

  const row = await prisma.exchangeRequest.create({
    data: {
      trackingCode,
      userId: toBigIntId(dto.userId),
      sourceCurrencyId: toBigIntId(dto.sourceCurrencyId),
      targetCurrencyId: toBigIntId(dto.targetCurrencyId),
      amount: decimalFromNumber(dto.amount),
      bankAccount,
      invoiceImageUrl,
      status: "pending",
    },
  });

  const request = mapExchangeRequest(row);

  await appendLog({
    actorType: "user",
    actorId: dto.userId,
    action: LOG_ACTIONS.botRequestCreate,
    entityType: "ExchangeRequest",
    entityId: request.id,
    metadata: {
      trackingCode: request.trackingCode,
      amount: request.amount,
    },
  });

  return request;
}

export async function listUserRequests(
  userId: EntityId,
  options: { page?: number; pageSize?: number } = {},
): Promise<{ items: BotRequestListItem[]; hasMore: boolean; page: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(10, Math.max(1, options.pageSize ?? 5));
  const where = { userId: toBigIntId(userId) };

  const [total, rows] = await Promise.all([
    prisma.exchangeRequest.count({ where }),
    prisma.exchangeRequest.findMany({
      where,
      include: requestListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(mapListItem),
    hasMore: total > page * pageSize,
    page,
  };
}

export async function getUserRequestDetail(
  userId: EntityId,
  requestId: EntityId,
): Promise<BotRequestDetail | null> {
  const row = await prisma.exchangeRequest.findFirst({
    where: {
      id: toBigIntId(requestId),
      userId: toBigIntId(userId),
    },
    include: requestListInclude,
  });

  return row ? mapDetail(row) : null;
}

export class BotRequestServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BotRequestServiceError";
  }
}
