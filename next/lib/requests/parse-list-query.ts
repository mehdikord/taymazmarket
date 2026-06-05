import type { ExchangeRequestStatus } from "@/lib/types";
import type { ListRequestsQuery } from "@/lib/services/requests";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

function parseStatus(raw?: string): ExchangeRequestStatus[] | undefined {
  if (!raw?.trim()) return undefined;
  const allowed: ExchangeRequestStatus[] = ["pending", "approved", "rejected"];
  const parts = raw.split(",").map((s) => s.trim()) as ExchangeRequestStatus[];
  const filtered = parts.filter((s) => allowed.includes(s));
  return filtered.length ? filtered : undefined;
}

export function parseRequestsListQuery(
  params: Record<string, string | string[] | undefined>,
): ListRequestsQuery {
  const page = Number(pickString(params, "page") ?? "1");
  const pageSize = Number(pickString(params, "pageSize") ?? "10");
  const userIdRaw = pickString(params, "userId");
  const userId = userIdRaw ? Number(userIdRaw) : undefined;
  const sourceCurrencyIdRaw = pickString(params, "sourceCurrencyId");
  const targetCurrencyIdRaw = pickString(params, "targetCurrencyId");
  const amountMinRaw = pickString(params, "amountMin");
  const amountMaxRaw = pickString(params, "amountMax");

  return {
    status: parseStatus(pickString(params, "status")),
    trackingCode: pickString(params, "trackingCode"),
    userId: Number.isInteger(userId) && userId! > 0 ? userId : undefined,
    sourceCurrencyId:
      Number.isInteger(Number(sourceCurrencyIdRaw)) &&
      Number(sourceCurrencyIdRaw) > 0
        ? Number(sourceCurrencyIdRaw)
        : undefined,
    targetCurrencyId:
      Number.isInteger(Number(targetCurrencyIdRaw)) &&
      Number(targetCurrencyIdRaw) > 0
        ? Number(targetCurrencyIdRaw)
        : undefined,
    amountMin: amountMinRaw ? Number(amountMinRaw) : undefined,
    amountMax: amountMaxRaw ? Number(amountMaxRaw) : undefined,
    createdFrom: pickString(params, "createdFrom"),
    createdTo: pickString(params, "createdTo"),
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
  };
}

export function buildRequestsSearchParams(
  query: ListRequestsQuery,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.status?.length) {
    sp.set("status", query.status.join(","));
  }
  if (query.trackingCode) sp.set("trackingCode", query.trackingCode);
  if (query.userId) sp.set("userId", String(query.userId));
  if (query.sourceCurrencyId) {
    sp.set("sourceCurrencyId", String(query.sourceCurrencyId));
  }
  if (query.targetCurrencyId) {
    sp.set("targetCurrencyId", String(query.targetCurrencyId));
  }
  if (query.amountMin != null) sp.set("amountMin", String(query.amountMin));
  if (query.amountMax != null) sp.set("amountMax", String(query.amountMax));
  if (query.createdFrom) sp.set("createdFrom", query.createdFrom);
  if (query.createdTo) sp.set("createdTo", query.createdTo);
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 10) {
    sp.set("pageSize", String(query.pageSize));
  }
  return sp;
}
