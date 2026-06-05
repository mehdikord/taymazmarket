"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import type { AdminPublic } from "@/lib/types";
import { AppBreadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

type AppHeaderProps = {
  admin: AdminPublic;
};

export function AppHeader({ admin }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-me-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="min-w-0 flex-1">
        <AppBreadcrumbs />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu admin={admin} />
      </div>
    </header>
  );
}
