"use client";

import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import type { AdminPublic } from "@/lib/types";
import { formatMobileDisplay } from "@/lib/utils/mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  admin: AdminPublic;
};

export function UserMenu({ admin }: UserMenuProps) {
  const initials = admin.name.slice(0, 2);

  async function handleLogout() {
    const res = await fetch("/api/auth/admin/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      toast.error("خروج ناموفق بود");
      return;
    }
    toast.success("با موفقیت خارج شدید");
    window.location.assign("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {admin.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <User className="size-4" />
              {admin.name}
            </p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {formatMobileDisplay(admin.mobile)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
