import { createdAtWhere } from "@/lib/db/dates";
import { decimalFromNumber, toBigIntId } from "@/lib/db/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ListRequestsQuery } from "../requests";

export function buildRequestsWhere(
  query: ListRequestsQuery,
): Prisma.ExchangeRequestWhereInput {
  const where: Prisma.ExchangeRequestWhereInput = {};

  if (query.status?.length) {
    where.status = { in: query.status };
  }

  if (query.trackingCode?.trim()) {
    where.trackingCode = { contains: query.trackingCode.trim() };
  }

  if (query.userId != null) {
    where.userId = toBigIntId(query.userId);
  }

  if (query.sourceCurrencyId != null) {
    where.sourceCurrencyId = toBigIntId(query.sourceCurrencyId);
  }

  if (query.targetCurrencyId != null) {
    where.targetCurrencyId = toBigIntId(query.targetCurrencyId);
  }

  const amountFilter: Prisma.DecimalFilter<"ExchangeRequest"> = {};
  if (query.amountMin != null && Number.isFinite(query.amountMin)) {
    amountFilter.gte = decimalFromNumber(query.amountMin);
  }
  if (query.amountMax != null && Number.isFinite(query.amountMax)) {
    amountFilter.lte = decimalFromNumber(query.amountMax);
  }
  if (amountFilter.gte !== undefined || amountFilter.lte !== undefined) {
    where.amount = amountFilter;
  }

  Object.assign(where, createdAtWhere(query.createdFrom, query.createdTo));

  return where;
}
