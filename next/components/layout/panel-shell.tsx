"use client";

import type { AdminPublic } from "@/lib/types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

type PanelShellProps = {
  admin: AdminPublic;
  pendingCount: number;
  children: React.ReactNode;
};

export function PanelShell({ admin, pendingCount, children }: PanelShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar pendingCount={pendingCount} />
      <SidebarInset className="min-h-svh bg-background">
        <AppHeader admin={admin} />
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
