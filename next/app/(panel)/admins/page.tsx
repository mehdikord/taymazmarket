import { requireAdmin } from "@/lib/auth/require-admin";
import { listAdmins } from "@/lib/services/admins";
import { AdminsPageClient } from "@/components/admins/admins-page-client";

export default async function AdminsPage() {
  const admin = await requireAdmin();
  const initialItems = await listAdmins();

  return (
    <AdminsPageClient
      currentAdminId={admin.id}
      initialItems={initialItems}
    />
  );
}
