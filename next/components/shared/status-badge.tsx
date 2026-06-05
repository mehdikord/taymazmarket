import type { ExchangeRequestStatus, UserStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | ExchangeRequestStatus
  | UserStatus
  | "default";

const config: Record<
  StatusBadgeVariant,
  { label: string; className?: string; badgeVariant?: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "در انتظار",
    badgeVariant: "outline",
    className: "border-amber-500/50 text-amber-700 dark:text-amber-400",
  },
  approved: {
    label: "تایید شده",
    badgeVariant: "default",
    className: "bg-emerald-600 hover:bg-emerald-600",
  },
  rejected: {
    label: "رد شده",
    badgeVariant: "destructive",
  },
  active: {
    label: "فعال",
    badgeVariant: "default",
    className: "bg-emerald-600 hover:bg-emerald-600",
  },
  inactive: {
    label: "غیرفعال",
    badgeVariant: "secondary",
  },
  default: { label: "—", badgeVariant: "secondary" },
};

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
};

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const item = config[variant];
  return (
    <Badge
      variant={item.badgeVariant ?? "secondary"}
      className={cn(item.className, className)}
    >
      {label ?? item.label}
    </Badge>
  );
}
