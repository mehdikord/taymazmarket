"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileClock } from "lucide-react";
import { PANEL_NAV } from "@/config/navigation";
import { DevResetButton } from "@/components/layout/dev-reset-button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  pendingCount: number;
};

export function AppSidebar({ pendingCount }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="border-l border-white/10 bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)]"
    >
      <SidebarHeader className="border-b border-white/10 p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            TM
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-white">تایماز مارکت</span>
            <span className="text-xs text-[var(--sidebar-foreground)]">
              پنل مدیریت
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {PANEL_NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[var(--sidebar-foreground)]/80 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const badgeCount =
                    item.badge === "pendingRequests" ? pendingCount : 0;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white"
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                          {badgeCount > 0 ? (
                            <Badge
                              variant="secondary"
                              className="ms-auto bg-amber-500/90 text-white group-data-[collapsible=icon]:hidden"
                            >
                              {badgeCount}
                            </Badge>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="space-y-2 border-t border-white/10 p-3 group-data-[collapsible=icon]:hidden">
        <DevResetButton />
        <p className="flex items-center gap-2 text-xs text-[var(--sidebar-foreground)]">
          <FileClock className="size-3.5" />
          نسخه Mock — پنل ادمین
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
