import type { ListUsersQuery, UserTab } from "@/lib/services/users";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

export function parseUsersListQuery(
  params: Record<string, string | string[] | undefined>,
): ListUsersQuery {
  const tabRaw = pickString(params, "tab");
  const tab: UserTab =
    tabRaw === "active" || tabRaw === "inactive" ? tabRaw : "all";

  const page = Number(pickString(params, "page") ?? "1");
  const pageSize = Number(pickString(params, "pageSize") ?? "10");

  const hasCodeRaw = pickString(params, "hasCode");
  const hasCode =
    hasCodeRaw === "true" || hasCodeRaw === "false" ? hasCodeRaw : undefined;

  return {
    tab,
    q: pickString(params, "q"),
    mobile: pickString(params, "mobile"),
    name: pickString(params, "name"),
    hasCode,
    chatId: pickString(params, "chatId"),
    createdFrom: pickString(params, "createdFrom"),
    createdTo: pickString(params, "createdTo"),
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
  };
}

export function buildUsersSearchParams(query: ListUsersQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (query.tab && query.tab !== "all") sp.set("tab", query.tab);
  if (query.q) sp.set("q", query.q);
  if (query.mobile) sp.set("mobile", query.mobile);
  if (query.name) sp.set("name", query.name);
  if (query.hasCode) sp.set("hasCode", query.hasCode);
  if (query.chatId) sp.set("chatId", query.chatId);
  if (query.createdFrom) sp.set("createdFrom", query.createdFrom);
  if (query.createdTo) sp.set("createdTo", query.createdTo);
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 10) {
    sp.set("pageSize", String(query.pageSize));
  }
  return sp;
}

/** مسیر canonical برای مقایسه قبل از router.replace */
export function usersListPath(query: ListUsersQuery): string {
  const qs = buildUsersSearchParams(query).toString();
  return qs ? `/users?${qs}` : "/users";
}

export function parseUsersListQueryFromString(
  searchParamsKey: string,
): ListUsersQuery {
  const entries = searchParamsKey
    ? Object.fromEntries(new URLSearchParams(searchParamsKey).entries())
    : {};
  return parseUsersListQuery(entries);
}
