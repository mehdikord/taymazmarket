"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, History, X } from "lucide-react";
import type { Currency, User } from "@/lib/types";
import type { ListRequestsResult, RequestListItem } from "@/lib/services/requests";
import {
  buildRequestsSearchParams,
  parseRequestsListQuery,
} from "@/lib/requests/parse-list-query";
import { formatNumber } from "@/lib/utils/format-number";
import { hideOnMobile, hideOnTablet } from "@/lib/responsive";
import { formatFaDateTime } from "@/lib/utils/dates";
import { formatMobileDisplay } from "@/lib/utils/mobile";
import { RequestDetailDialog } from "@/components/requests/request-detail-dialog";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import {
  AdvancedFilterSheet,
  type FilterFieldConfig,
  type FilterValues,
} from "@/components/shared/advanced-filter-sheet";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
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

type HistoryRequestsPageClientProps = {
  initialResult: ListRequestsResult;
  users: Pick<User, "id" | "name" | "mobile">[];
  currencies: Pick<Currency, "id" | "title">[];
};

function filterValuesFromParams(params: URLSearchParams): FilterValues {
  return {
    status: params.get("status") ?? "approved,rejected",
    trackingCode: params.get("trackingCode") ?? "",
    userId: params.get("userId") ?? "",
    sourceCurrencyId: params.get("sourceCurrencyId") ?? "",
    targetCurrencyId: params.get("targetCurrencyId") ?? "",
    amountMin: params.get("amountMin") ?? "",
    amountMax: params.get("amountMax") ?? "",
    createdFrom: params.get("createdFrom") ?? "",
    createdTo: params.get("createdTo") ?? "",
  };
}

function countActiveFilters(values: FilterValues): number {
  const ignore = new Set(["status"]);
  return Object.entries(values).filter(
    ([k, v]) => !ignore.has(k) && v.trim(),
  ).length;
}

function statusLabel(raw: string): string {
  if (raw === "approved") return "تایید شده";
  if (raw === "rejected") return "رد شده";
  if (raw === "approved,rejected") return "همه وضعیت‌ها";
  return raw;
}

export function HistoryRequestsPageClient({
  initialResult,
  users,
  currencies,
}: HistoryRequestsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const result = initialResult;

  const [detailTarget, setDetailTarget] = useState<RequestListItem | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        type: "select",
        name: "status",
        label: "وضعیت",
        options: [
          { value: "approved,rejected", label: "تایید + رد" },
          { value: "approved", label: "تایید شده" },
          { value: "rejected", label: "رد شده" },
        ],
      },
      {
        type: "text",
        name: "trackingCode",
        label: "کد پیگیری",
        dir: "ltr",
        placeholder: "123456",
      },
      {
        type: "select",
        name: "userId",
        label: "کاربر",
        options: [
          { value: "", label: "همه" },
          ...users.map((u) => ({
            value: String(u.id),
            label: u.name ?? u.mobile,
          })),
        ],
      },
      {
        type: "select",
        name: "sourceCurrencyId",
        label: "ارز مبدا",
        options: [
          { value: "", label: "همه" },
          ...currencies.map((c) => ({
            value: String(c.id),
            label: c.title,
          })),
        ],
      },
      {
        type: "select",
        name: "targetCurrencyId",
        label: "ارز مقصد",
        options: [
          { value: "", label: "همه" },
          ...currencies.map((c) => ({
            value: String(c.id),
            label: c.title,
          })),
        ],
      },
      { type: "number", name: "amountMin", label: "حداقل مبلغ" },
      { type: "number", name: "amountMax", label: "حداکثر مبلغ" },
      { type: "date", name: "createdFrom", label: "از تاریخ" },
      { type: "date", name: "createdTo", label: "تا تاریخ" },
    ],
    [users, currencies],
  );

  const appliedFilters = useMemo(
    () => filterValuesFromParams(searchParams),
    [searchParams],
  );
  const activeFilterCount = countActiveFilters(appliedFilters);

  const syncUrl = useCallback(
    (patch: Partial<ReturnType<typeof parseRequestsListQuery>>) => {
      const current = parseRequestsListQuery(
        Object.fromEntries(searchParams.entries()),
      );
      const next = { ...current, ...patch };
      const sp = buildRequestsSearchParams(next);
      const qs = sp.toString();
      router.replace(qs ? `/requests/history?${qs}` : "/requests/history");
    },
    [router, searchParams],
  );

  function applyFilters(draft: FilterValues) {
    const statusRaw = draft.status || "approved,rejected";
    const statusParts = statusRaw.split(",") as (
      | "approved"
      | "rejected"
      | "pending"
    )[];

    syncUrl({
      status: statusParts.filter((s) =>
        ["approved", "rejected", "pending"].includes(s),
      ),
      trackingCode: draft.trackingCode || undefined,
      userId: draft.userId ? Number(draft.userId) : undefined,
      sourceCurrencyId: draft.sourceCurrencyId
        ? Number(draft.sourceCurrencyId)
        : undefined,
      targetCurrencyId: draft.targetCurrencyId
        ? Number(draft.targetCurrencyId)
        : undefined,
      amountMin: draft.amountMin ? Number(draft.amountMin) : undefined,
      amountMax: draft.amountMax ? Number(draft.amountMax) : undefined,
      createdFrom: draft.createdFrom || undefined,
      createdTo: draft.createdTo || undefined,
      page: 1,
    });
  }

  function resetFilters() {
    router.replace("/requests/history?status=approved,rejected");
  }

  function handlePageChange(nextPage: number) {
    syncUrl({ page: nextPage });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تاریخچه درخواست‌ها"
        description="درخواست‌های تایید شده و رد شده — فقط مشاهده"
      />

      <ListCard>
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {result.total} مورد در نتایج
          </p>
          <AdvancedFilterSheet
            fields={filterFields}
            appliedValues={appliedFilters}
            onApply={applyFilters}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </div>

        {activeFilterCount > 0 ||
        appliedFilters.status !== "approved,rejected" ? (
          <div className="flex flex-wrap gap-2 border-b px-4 pb-4">
            {appliedFilters.status &&
            appliedFilters.status !== "approved,rejected" ? (
              <FilterChip
                label={`وضعیت: ${statusLabel(appliedFilters.status)}`}
                onClear={() =>
                  syncUrl({ status: ["approved", "rejected"], page: 1 })
                }
              />
            ) : null}
            {appliedFilters.trackingCode ? (
              <FilterChip
                label={`کد: ${appliedFilters.trackingCode}`}
                onClear={() => syncUrl({ trackingCode: undefined, page: 1 })}
              />
            ) : null}
            {appliedFilters.userId ? (
              <FilterChip
                label={`کاربر: ${
                  users.find((u) => String(u.id) === appliedFilters.userId)
                    ?.name ?? appliedFilters.userId
                }`}
                onClear={() => syncUrl({ userId: undefined, page: 1 })}
              />
            ) : null}
            {(appliedFilters.amountMin || appliedFilters.amountMax) ? (
              <FilterChip
                label={`مبلغ: ${appliedFilters.amountMin || "…"} – ${appliedFilters.amountMax || "…"}`}
                onClear={() =>
                  syncUrl({
                    amountMin: undefined,
                    amountMax: undefined,
                    page: 1,
                  })
                }
              />
            ) : null}
          </div>
        ) : null}

        {result.items.length === 0 ? (
          <EmptyState
            icon={History}
            title="موردی یافت نشد"
            description="فیلترها را تغییر دهید"
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
                <TableHead>وضعیت</TableHead>
                <TableHead className={hideOnTablet}>دلیل رد</TableHead>
                <TableHead className={hideOnMobile}>بررسی</TableHead>
                <TableHead className={hideOnMobile}>فاکتور</TableHead>
                <TableHead className="w-[140px]">جزئیات</TableHead>
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
                      className="text-sm font-medium hover:text-primary hover:underline"
                    >
                      {req.user.name ?? "—"}
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
                  <TableCell>
                    <RequestStatusBadge status={req.status} />
                  </TableCell>
                  <TableCell
                    className={`max-w-[160px] truncate text-sm text-muted-foreground ${hideOnTablet}`}
                  >
                    {req.status === "rejected"
                      ? req.rejectionReason ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell
                    className={`text-sm text-muted-foreground ${hideOnMobile}`}
                  >
                    {req.reviewer ? (
                      <>
                        <span className="text-foreground">
                          {req.reviewer.name}
                        </span>
                        {req.reviewedAt ? (
                          <span className="block text-xs">
                            {formatFaDateTime(req.reviewedAt)}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableScroll>
        )}

        <DataTablePagination
          state={{
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
            totalPages: result.totalPages,
          }}
          onPageChange={handlePageChange}
        />
      </ListCard>

      <RequestDetailDialog
        request={detailTarget}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        className="rounded-full p-0.5 hover:bg-muted"
        onClick={onClear}
        aria-label="حذف فیلتر"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}
