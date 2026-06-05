import { requireAdmin } from "@/lib/auth/require-admin";
import { notDeleted } from "@/lib/db/soft-delete";
import { toEntityId } from "@/lib/db/serialize";
import { prisma } from "@/lib/prisma";
import { listRequests } from "@/lib/services/requests";
import { parseRequestsListQuery } from "@/lib/requests/parse-list-query";
import { HistoryRequestsPageClient } from "@/components/requests/history-requests-page-client";

type HistoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RequestsHistoryPage({
  searchParams,
}: HistoryPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseRequestsListQuery(params);

  if (!query.status?.length) {
    query.status = ["approved", "rejected"];
  }

  const [initialResult, userRows, currencyRows] = await Promise.all([
    listRequests(query),
    prisma.user.findMany({
      where: notDeleted,
      select: { id: true, name: true, mobile: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  ]);

  const users = userRows
    .map((u) => ({
      id: toEntityId(u.id),
      name: u.name,
      mobile: u.mobile,
    }))
    .sort((a, b) =>
      (a.name ?? a.mobile).localeCompare(b.name ?? b.mobile, "fa"),
    );

  const currencies = currencyRows
    .map((c) => ({ id: toEntityId(c.id), title: c.title }))
    .sort((a, b) => a.title.localeCompare(b.title, "fa"));

  return (
    <HistoryRequestsPageClient
      initialResult={initialResult}
      users={users}
      currencies={currencies}
    />
  );
}
