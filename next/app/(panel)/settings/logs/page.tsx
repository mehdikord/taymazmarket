import { requireAdmin } from "@/lib/auth/require-admin";
import { parseLogsListQuery } from "@/lib/logs/parse-list-query";
import { listLogs } from "@/lib/services/logs";
import { LogsPageClient } from "@/components/settings/logs-page-client";

type LogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LogsPage({ searchParams }: LogsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseLogsListQuery(params);
  const initialResult = await listLogs(query);

  return <LogsPageClient initialResult={initialResult} />;
}
