import Link from "next/link";
import {
  Coins,
  FileText,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const actions = [
  {
    label: "بررسی درخواست‌ها",
    href: "/requests/new",
    icon: FileText,
    variant: "default" as const,
  },
  {
    label: "کاربران",
    href: "/users",
    icon: Users,
    variant: "outline" as const,
  },
  {
    label: "کاربر جدید",
    href: "/users",
    icon: UserPlus,
    variant: "outline" as const,
  },
  {
    label: "ارزها",
    href: "/settings/currencies",
    icon: Coins,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <Card className="border-0 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">دسترسی سریع</CardTitle>
        <CardDescription>میانبر به پرکاربردترین بخش‌ها</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="size-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
