"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, FileText, XCircle } from "lucide-react";
import type { ListRequestsResult, RequestListItem } from "@/lib/services/requests";
import { formatNumber } from "@/lib/utils/format-number";
import { hideOnMobile } from "@/lib/responsive";
import { formatFaDate } from "@/lib/utils/dates";
import { formatMobileDisplay } from "@/lib/utils/mobile";
import { ApproveRequestDialog } from "@/components/requests/approve-request-dialog";
import { RejectRequestDialog } from "@/components/requests/reject-request-dialog";
import { RequestDetailDialog } from "@/components/requests/request-detail-dialog";
import { ListCard } from "@/components/data-table/list-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableLtrValue } from "@/components/shared/table-ltr-value";
import { TableScroll } from "@/components/shared/table-scroll";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PendingRequestsPageClientProps = {
  initialResult: ListRequestsResult;
};

export function PendingRequestsPageClient({
  initialResult,
}: PendingRequestsPageClientProps) {
  const router = useRouter();
  const result = initialResult;

  const [approveTarget, setApproveTarget] = useState<RequestListItem | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<RequestListItem | null>(
    null,
  );
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<RequestListItem | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="درخواست‌های جدید"
        description="فقط درخواست‌های در انتظار تایید — بررسی و تایید یا رد"
        action={
          <Badge variant="secondary" className="gap-1 px-3 py-1 text-sm">
            <FileText className="size-4" />
            {result.total} در انتظار
          </Badge>
        }
      />

      <ListCard>
        {result.items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="درخواست در انتظاری نیست"
            description="همه درخواست‌ها بررسی شده‌اند"
          />
        ) : (
          <TableScroll>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کد پیگیری</TableHead>
                <TableHead>کاربر</TableHead>
                <TableHead>تبدیل</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead className={hideOnMobile}>تاریخ</TableHead>
                <TableHead className={hideOnMobile}>فاکتور</TableHead>
                <TableHead className="w-[140px]">جزئیات</TableHead>
                <TableHead className="w-[180px]">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      <TableLtrValue>{req.trackingCode}</TableLtrValue>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/users?highlight=${req.user.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {req.user.name ?? "بدون نام"}
                    </Link>
                    <TableLtrValue className="font-mono text-xs text-muted-foreground">
                      {formatMobileDisplay(req.user.mobile)}
                    </TableLtrValue>
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.sourceCurrency.title} → {req.targetCurrency.title}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatNumber(req.amount)}
                  </TableCell>
                  <TableCell
                    className={`text-sm text-muted-foreground ${hideOnMobile}`}
                  >
                    {formatFaDate(req.createdAt)}
                  </TableCell>
                  <TableCell className={hideOnMobile}>
                    <ImageLightbox src={req.invoiceImageUrl} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setDetailTarget(req);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="size-4" />
                      مشاهده جزئیات
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setApproveTarget(req);
                          setApproveOpen(true);
                        }}
                      >
                        <CheckCircle2 className="size-4" />
                        تایید
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => {
                          setRejectTarget(req);
                          setRejectOpen(true);
                        }}
                      >
                        <XCircle className="size-4" />
                        رد
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableScroll>
        )}
      </ListCard>

      <ApproveRequestDialog
        request={approveTarget}
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onSuccess={refresh}
      />

      <RejectRequestDialog
        request={rejectTarget}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSuccess={refresh}
      />

      <RequestDetailDialog
        request={detailTarget}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
