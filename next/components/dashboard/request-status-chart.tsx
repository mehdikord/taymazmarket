import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { DashboardStats } from "@/lib/stats/dashboard";
import { formatNumber } from "@/lib/utils/format-number";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RequestStatusChartProps = {
  breakdown: DashboardStats["requestBreakdown"];
  total: number;
};

const segments = [
  {
    key: "pending" as const,
    label: "در انتظار",
    icon: Clock,
    color: "bg-amber-500",
    text: "text-amber-600",
  },
  {
    key: "approved" as const,
    label: "تایید شده",
    icon: CheckCircle2,
    color: "bg-emerald-500",
    text: "text-emerald-600",
  },
  {
    key: "rejected" as const,
    label: "رد شده",
    icon: XCircle,
    color: "bg-rose-500",
    text: "text-rose-600",
  },
];

export function RequestStatusChart({
  breakdown,
  total,
}: RequestStatusChartProps) {
  const max = Math.max(breakdown.pending, breakdown.approved, breakdown.rejected, 1);

  return (
    <Card className="h-full border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">وضعیت درخواست‌ها</CardTitle>
        <CardDescription>
          مجموع {formatNumber(total)} درخواست در سیستم
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {segments.map((seg) => {
            const count = breakdown[seg.key];
            const width = total > 0 ? (count / total) * 100 : 0;
            if (width <= 0) return null;
            return (
              <div
                key={seg.key}
                className={`${seg.color} transition-all`}
                style={{ width: `${width}%` }}
                title={`${seg.label}: ${count}`}
              />
            );
          })}
        </div>

        <div className="space-y-4">
          {segments.map((seg) => {
            const count = breakdown[seg.key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const barWidth = (count / max) * 100;
            const Icon = seg.icon;

            return (
              <div key={seg.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className={`size-4 ${seg.text}`} />
                    {seg.label}
                  </span>
                  <span className="text-muted-foreground">
                    {formatNumber(count)}{" "}
                    <span className="text-xs">({pct}٪)</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${seg.color} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
