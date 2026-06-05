import { notFound } from "next/navigation";
import { getDevPanelStats } from "@/lib/dev/panel-stats";
import { DevToolsPanel } from "@/components/settings/dev-tools-panel";

export default async function DevSettingsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const stats = await getDevPanelStats();

  return <DevToolsPanel stats={stats} />;
}
