import { requireAdmin } from "@/lib/auth/require-admin";
import { getUserTabCounts, listUsers } from "@/lib/services/users";
import { parseUsersListQuery } from "@/lib/users/parse-list-query";
import { UsersPageClient } from "@/components/users/users-page-client";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseUsersListQuery(params);
  const [initialResult, tabCounts] = await Promise.all([
    listUsers(query),
    getUserTabCounts(),
  ]);

  return (
    <UsersPageClient
      initialResult={initialResult}
      tabCounts={tabCounts}
    />
  );
}
