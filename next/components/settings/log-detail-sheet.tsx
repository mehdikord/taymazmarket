"use client";

import { useState, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { LogListItem } from "@/lib/services/logs";
import { getActionLabelFa } from "@/lib/logging/action-labels";
import { formatFaDateTime } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const actorBadge: Record<
  LogListItem["actorType"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  admin: { label: "مدیر", variant: "default" },
  user: { label: "کاربر", variant: "secondary" },
  system: { label: "سیستم", variant: "outline" },
};

type LogDetailSheetProps = {
  log: LogListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogDetailSheet({
  log,
  open,
  onOpenChange,
}: LogDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const badge = actorBadge[log.actorType];
  const metadataJson = log.metadata
    ? JSON.stringify(log.metadata, null, 2)
    : null;

  async function copyMetadata() {
    if (!metadataJson) return;
    try {
      await navigator.clipboard.writeText(metadataJson);
      setCopied(true);
      toast.success("در حافظه کپی شد");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی ناموفق بود");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>جزئیات لاگ</SheetTitle>
          <SheetDescription>#{log.id}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <Row label="زمان">{formatFaDateTime(log.createdAt)}</Row>
          <Row label="عمل">
            {getActionLabelFa(log.action)}
            <span className="mt-1 block font-mono text-xs text-muted-foreground" dir="ltr">
              {log.action}
            </span>
          </Row>
          <Row label="عامل">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {log.actorDisplayName ? (
              <span className="mt-1 block text-sm">{log.actorDisplayName}</span>
            ) : null}
            {log.actorId != null ? (
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                ID: {log.actorId}
              </span>
            ) : null}
          </Row>
          <Row label="موجودیت">
            {log.entityType}
            {log.entityId != null ? ` #${log.entityId}` : ""}
          </Row>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">metadata</p>
              {metadataJson ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={copyMetadata}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  کپی
                </Button>
              ) : null}
            </div>
            {metadataJson ? (
              <pre
                dir="ltr"
                className="max-h-64 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs"
              >
                {metadataJson}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
