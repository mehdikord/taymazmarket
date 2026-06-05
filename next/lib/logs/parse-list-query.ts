import type { LogActorType } from "@/lib/types";
import type { ListLogsQuery } from "@/lib/services/logs";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

function parseActorType(raw?: string): LogActorType | undefined {
  if (raw === "admin" || raw === "user" || raw === "system") return raw;
  return undefined;
}

export function parseLogsListQuery(
  params: Record<string, string | string[] | undefined>,
): ListLogsQuery {
  const page = Number(pickString(params, "page") ?? "1");
  const pageSize = Number(pickString(params, "pageSize") ?? "20");
  const actorIdRaw = pickString(params, "actorId");

  return {
    actorType: parseActorType(pickString(params, "actorType")),
    actorId: actorIdRaw ? Number(actorIdRaw) : undefined,
    action: pickString(params, "action"),
    entityType: pickString(params, "entityType"),
    createdFrom: pickString(params, "createdFrom"),
    createdTo: pickString(params, "createdTo"),
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
  };
}

export function buildLogsSearchParams(query: ListLogsQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.actorType) sp.set("actorType", query.actorType);
  if (query.actorId) sp.set("actorId", String(query.actorId));
  if (query.action) sp.set("action", query.action);
  if (query.entityType) sp.set("entityType", query.entityType);
  if (query.createdFrom) sp.set("createdFrom", query.createdFrom);
  if (query.createdTo) sp.set("createdTo", query.createdTo);
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 20) {
    sp.set("pageSize", String(query.pageSize));
  }
  return sp;
}
