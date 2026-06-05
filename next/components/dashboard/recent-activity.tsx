import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import type { SystemLog } from "@/lib/types";
import { getActionLabelFa } from "@/lib/logging/action-labels";
import { formatFaDateTime } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const actorBadge: Record<
  SystemLog["actorType"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  admin: { label: "مدیر", variant: "default" },
  user: { label: "کاربر", variant: "secondary" },
  system: { label: "سیستم", variant: "outline" },
};

type RecentActivityProps = {
  logs: SystemLog[];
};

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <Card className="h-full border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="size-5 text-primary" />
            فعالیت اخیر
          </CardTitle>
          <CardDescription>آخرین رویدادهای ثبت‌شده در سیستم</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings/logs" className="gap-1">
            همه
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {logs.map((log) => {
            const badge = actorBadge[log.actorType];
            return (
              <li
                key={log.id}
                className="flex gap-3 rounded-xl border border-transparent bg-muted/40 p-3 transition-colors hover:border-border hover:bg-muted/70"
              >
                <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {getActionLabelFa(log.action)}
                    </span>
                    <Badge variant={badge.variant} className="text-[10px]">
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.entityType}
                    {log.entityId != null ? ` #${log.entityId}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFaDateTime(log.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
