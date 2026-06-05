"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Banknote,
  CalendarClock,
  AlertCircle,
  Landmark,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import type { RequestListItem } from "@/lib/services/requests";
import { formatNumber } from "@/lib/utils/format-number";
import { formatFaDateTime } from "@/lib/utils/dates";
import { formatMobileDisplay } from "@/lib/utils/mobile";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type RequestDetailDialogProps = {
  request: RequestListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
}: RequestDetailDialogProps) {
  if (!request) return null;

  const telegramLabel = request.user.telegramUsername
    ? `@${request.user.telegramUsername}`
    : "ثبت نشده";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="border-b bg-gradient-to-b from-muted/60 to-background px-6 py-5">
          <DialogHeader className="space-y-3 text-right">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="text-lg">جزئیات درخواست</DialogTitle>
                <DialogDescription asChild>
                  <p className="text-sm text-muted-foreground">
                    اطلاعات کامل ثبت‌شده توسط کاربر
                  </p>
                </DialogDescription>
              </div>
              <RequestStatusBadge status={request.status} />
            </div>
            <Badge variant="outline" className="w-fit font-mono text-sm" dir="ltr">
              {request.trackingCode}
            </Badge>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailCard
              icon={User}
              label="نام کاربر"
              value={
                <Link
                  href={`/users?highlight=${request.user.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {request.user.name ?? "بدون نام"}
                </Link>
              }
            />
            <DetailCard
              icon={Phone}
              label="شماره موبایل"
              value={
                <span dir="ltr" className="font-mono">
                  {formatMobileDisplay(request.user.mobile)}
                </span>
              }
            />
            <DetailCard
              icon={MessageCircle}
              label="یوزرنیم تلگرام"
              value={
                <span
                  dir="ltr"
                  className={cn(
                    "font-mono",
                    !request.user.telegramUsername && "text-muted-foreground",
                  )}
                >
                  {telegramLabel}
                </span>
              }
            />
            <DetailCard
              icon={Banknote}
              label="مبلغ"
              value={
                <span className="text-base font-semibold tabular-nums">
                  {formatNumber(request.amount)}
                </span>
              }
            />
            <DetailCard
              icon={ArrowLeftRight}
              label="تبدیل ارز"
              value={`${request.sourceCurrency.title} → ${request.targetCurrency.title}`}
              className="sm:col-span-2"
            />
            <DetailCard
              icon={Landmark}
              label="حساب بانکی این درخواست"
              value={
                <span dir="ltr" className="break-all font-mono text-sm">
                  {request.bankAccount}
                </span>
              }
              className="sm:col-span-2"
            />
            <DetailCard
              icon={CalendarClock}
              label="تاریخ ثبت"
              value={formatFaDateTime(request.createdAt)}
            />
            {request.reviewer ? (
              <DetailCard
                icon={ShieldCheck}
                label="بررسی"
                value={
                  <>
                    <span className="font-medium">{request.reviewer.name}</span>
                    {request.reviewedAt ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatFaDateTime(request.reviewedAt)}
                      </span>
                    ) : null}
                  </>
                }
              />
            ) : null}
            {request.status === "rejected" ? (
              <DetailCard
                icon={AlertCircle}
                label="دلیل رد"
                value={request.rejectionReason ?? "—"}
                className="sm:col-span-2"
                variant="destructive"
              />
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium">تصویر فاکتور</p>
            <ImageLightbox
              src={request.invoiceImageUrl}
              thumbnailClassName="size-28 sm:size-32"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  className,
  variant = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  className?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border bg-card p-4 shadow-sm",
        variant === "destructive" && "border-destructive/30 bg-destructive/5",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          variant === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm leading-relaxed">{value}</div>
      </div>
    </div>
  );
}
