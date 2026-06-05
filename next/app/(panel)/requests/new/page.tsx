import { requireAdmin } from "@/lib/auth/require-admin";
import { listRequests } from "@/lib/services/requests";
import { PendingRequestsPageClient } from "@/components/requests/pending-requests-page-client";

export default async function NewRequestsPage() {
  await requireAdmin();
  const initialResult = await listRequests({
    status: ["pending"],
    page: 1,
    pageSize: 50,
  });

  return <PendingRequestsPageClient initialResult={initialResult} />;
}
