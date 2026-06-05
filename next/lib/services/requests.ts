import { mapExchangeRequest } from "@/lib/db/mappers";
import { notDeleted } from "@/lib/db/soft-delete";
import { toBigIntId, toEntityId } from "@/lib/db/serialize";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { prisma } from "@/lib/prisma";
import type {
  EntityId,
  ExchangeRequest,
  ExchangeRequestStatus,
} from "@/lib/types";
import type { Prisma } from "@/lib/generated/prisma/client";
import { buildRequestsWhere } from "./requests/build-where";

export type ListRequestsQuery = {
  status?: ExchangeRequestStatus[];
  trackingCode?: string;
  userId?: EntityId;
  sourceCurrencyId?: EntityId;
  targetCurrencyId?: EntityId;
  amountMin?: number;
  amountMax?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
};

export type RequestUserSummary = {
  id: EntityId;
  name: string | null;
  mobile: string;
  telegramUsername: string | null;
};

export type RequestCurrencySummary = {
  id: EntityId;
  title: string;
  slug: string;
};

export type RequestReviewerSummary = {
  id: EntityId;
  name: string;
};

export type RequestListItem = ExchangeRequest & {
  user: RequestUserSummary;
  sourceCurrency: RequestCurrencySummary;
  targetCurrency: RequestCurrencySummary;
  reviewer: RequestReviewerSummary | null;
};

export type ListRequestsResult = {
  items: RequestListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const requestInclude = {
  user: {
    select: {
      id: true,
      name: true,
      mobile: true,
      telegramUsername: true,
      deletedAt: true,
    },
  },
  sourceCurrency: { select: { id: true, title: true, slug: true } },
  targetCurrency: { select: { id: true, title: true, slug: true } },
  reviewedBy: {
    select: { id: true, name: true, deletedAt: true },
  },
} satisfies Prisma.ExchangeRequestInclude;

type RequestRow = Prisma.ExchangeRequestGetPayload<{
  include: typeof requestInclude;
}>;

function enrichRequest(row: RequestRow): RequestListItem {
  const request = mapExchangeRequest(row);
  const userRow = row.user.deletedAt == null ? row.user : null;
  const reviewerRow =
    row.reviewedBy && row.reviewedBy.deletedAt == null ? row.reviewedBy : null;

  return {
    ...request,
    user: {
      id: userRow ? toEntityId(userRow.id) : request.userId,
      name: userRow?.name ?? null,
      mobile: userRow?.mobile ?? "—",
      telegramUsername: userRow?.telegramUsername ?? null,
    },
    sourceCurrency: {
      id: toEntityId(row.sourceCurrency.id),
      title: row.sourceCurrency.title,
      slug: row.sourceCurrency.slug,
    },
    targetCurrency: {
      id: toEntityId(row.targetCurrency.id),
      title: row.targetCurrency.title,
      slug: row.targetCurrency.slug,
    },
    reviewer: reviewerRow
      ? { id: toEntityId(reviewerRow.id), name: reviewerRow.name }
      : null,
  };
}

export async function listRequests(
  query: ListRequestsQuery = {},
): Promise<ListRequestsResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 10));
  const where = buildRequestsWhere(query);

  const [total, rows] = await Promise.all([
    prisma.exchangeRequest.count({ where }),
    prisma.exchangeRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: rows.map(enrichRequest),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function countPendingRequests(): Promise<number> {
  return prisma.exchangeRequest.count({ where: { status: "pending" } });
}

async function findRequestEnriched(
  id: EntityId,
): Promise<RequestListItem | undefined> {
  const row = await prisma.exchangeRequest.findUnique({
    where: { id: toBigIntId(id) },
    include: requestInclude,
  });
  return row ? enrichRequest(row) : undefined;
}

async function assertPendingOrThrow(
  id: EntityId,
): Promise<RequestListItem> {
  const existing = await findRequestEnriched(id);
  if (!existing) {
    throw new RequestServiceError("not_found", "درخواست یافت نشد", 404);
  }
  if (existing.status !== "pending") {
    throw new RequestServiceError(
      "not_pending",
      "این درخواست قبلاً بررسی شده است",
      409,
    );
  }
  return existing;
}

export async function approveRequest(
  id: EntityId,
  actorId: EntityId,
): Promise<RequestListItem> {
  await assertPendingOrThrow(id);

  const updated = await prisma.exchangeRequest.updateMany({
    where: { id: toBigIntId(id), status: "pending" },
    data: {
      status: "approved",
      reviewedById: toBigIntId(actorId),
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  if (updated.count === 0) {
    throw new RequestServiceError(
      "not_pending",
      "این درخواست قبلاً بررسی شده است",
      409,
    );
  }

  const item = await findRequestEnriched(id);
  if (!item) {
    throw new RequestServiceError("not_found", "درخواست یافت نشد", 404);
  }

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.requestApprove,
    entityType: "ExchangeRequest",
    entityId: id,
    metadata: { trackingCode: item.trackingCode },
  });

  const { notifyRequestApproved } = await import("@/lib/services/telegram-notify");
  void notifyRequestApproved(id).catch(() => undefined);

  return item;
}

export async function rejectRequest(
  id: EntityId,
  reason: string,
  actorId: EntityId,
): Promise<RequestListItem> {
  await assertPendingOrThrow(id);

  const updated = await prisma.exchangeRequest.updateMany({
    where: { id: toBigIntId(id), status: "pending" },
    data: {
      status: "rejected",
      rejectionReason: reason,
      reviewedById: toBigIntId(actorId),
      reviewedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    throw new RequestServiceError(
      "not_pending",
      "این درخواست قبلاً بررسی شده است",
      409,
    );
  }

  const item = await findRequestEnriched(id);
  if (!item) {
    throw new RequestServiceError("not_found", "درخواست یافت نشد", 404);
  }

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.requestReject,
    entityType: "ExchangeRequest",
    entityId: id,
    metadata: {
      trackingCode: item.trackingCode,
      reason: reason.slice(0, 120),
    },
  });

  const { notifyRequestRejected } = await import("@/lib/services/telegram-notify");
  void notifyRequestRejected(id, reason).catch(() => undefined);

  return item;
}

export class RequestServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "RequestServiceError";
  }
}
