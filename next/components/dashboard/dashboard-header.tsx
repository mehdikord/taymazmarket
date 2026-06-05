import type { AdminPublic } from "@/lib/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صبح بخیر";
  if (hour < 17) return "ظهر بخیر";
  if (hour < 21) return "عصر بخیر";
  return "شب بخیر";
}

type DashboardHeaderProps = {
  admin: AdminPublic;
};

export function DashboardHeader({ admin }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-l from-primary/10 via-background to-amber-500/5 p-6 md:p-8">
      <div
        className="pointer-events-none absolute -left-8 -top-8 size-40 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 size-48 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          {getGreeting()}، {admin.name}
        </p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          داشبورد مدیریت
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground md:text-base">
          نمای کلی از درخواست‌ها، کاربران و فعالیت‌های اخیر سیستم تبدیل ارز
          تایماز مارکت
        </p>
      </div>
    </div>
  );
}
