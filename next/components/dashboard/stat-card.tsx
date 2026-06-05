import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format-number";

type StatCardProps = {
  title: string;
  value: number;
  description?: string;
  href: string;
  icon: LucideIcon;
  accent: "amber" | "blue" | "emerald" | "slate";
};

const accentStyles = {
  amber: {
    card: "from-amber-500/10 via-card to-card hover:shadow-amber-500/10",
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    ring: "group-hover:ring-amber-500/20",
    value: "text-amber-700 dark:text-amber-300",
  },
  blue: {
    card: "from-blue-500/10 via-card to-card hover:shadow-blue-500/10",
    icon: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    ring: "group-hover:ring-blue-500/20",
    value: "text-blue-700 dark:text-blue-300",
  },
  emerald: {
    card: "from-emerald-500/10 via-card to-card hover:shadow-emerald-500/10",
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "group-hover:ring-emerald-500/20",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  slate: {
    card: "from-slate-500/10 via-card to-card hover:shadow-slate-500/10",
    icon: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
    ring: "group-hover:ring-slate-500/20",
    value: "text-slate-700 dark:text-slate-300",
  },
};

export function StatCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  accent,
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        styles.card,
        "ring-1 ring-transparent",
        styles.ring,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="size-5" />
        </div>
        <ArrowLeft className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-3xl font-bold tracking-tight", styles.value)}>
          {formatNumber(value)}
        </p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </Link>
  );
}
