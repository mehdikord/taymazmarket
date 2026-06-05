import type { LucideIcon } from "lucide-react";
import {
  Coins,
  FileText,
  History,
  LayoutDashboard,
  ScrollText,
  UserCog,
  Users,
} from "lucide-react";

export type NavBadgeKey = "pendingRequests";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: NavBadgeKey;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const PANEL_NAV: NavGroup[] = [
  {
    label: "اصلی",
    items: [
      { title: "داشبورد", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "مدیریت",
    items: [
      { title: "مدیران", href: "/admins", icon: UserCog },
      { title: "کاربران", href: "/users", icon: Users },
    ],
  },
  {
    label: "درخواست‌ها",
    items: [
      {
        title: "درخواست‌های جدید",
        href: "/requests/new",
        icon: FileText,
        badge: "pendingRequests",
      },
      {
        title: "تاریخچه",
        href: "/requests/history",
        icon: History,
      },
    ],
  },
  {
    label: "تنظیمات",
    items: [
      { title: "ارزها", href: "/settings/currencies", icon: Coins },
      { title: "لاگ‌ها", href: "/settings/logs", icon: ScrollText },
    ],
  },
];
