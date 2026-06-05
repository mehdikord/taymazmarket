import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardStats } from "@/lib/stats/dashboard";
import { PanelShell } from "@/components/layout/panel-shell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const { pendingRequests } = await getDashboardStats();

  return (
    <PanelShell admin={admin} pendingCount={pendingRequests}>
      {children}
    </PanelShell>
  );
}
