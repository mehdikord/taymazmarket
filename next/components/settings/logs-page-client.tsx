"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, ScrollText, X } from "lucide-react";
import type { LogActorType } from "@/lib/types";
import type { ListLogsResult, LogListItem } from "@/lib/services/logs";
import { getActionLabelFa } from "@/lib/logging/action-labels";
import {
  buildLogsSearchParams,
  parseLogsListQuery,
} from "@/lib/logs/parse-list-query";
import { formatFaDateTime } from "@/lib/utils/dates";
import { LogDetailSheet } from "@/components/settings/log-detail-sheet";
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

const ACTOR_LABELS: Record<LogActorType, string> = {
  admin: "مدیر",
  user: "کاربر",
  system: "سیستم",
};

const ENTITY_TYPES = [
  "Admin",
  "User",
  "Currency",
  "ExchangeRequest",
] as const;

function filterValuesFromParams(params: URLSearchParams): FilterValues {
  return {
    actorType: params.get("actorType") ?? "",
    action: params.get("action") ?? "",
    entityType: params.get("entityType") ?? "",
    createdFrom: params.get("createdFrom") ?? "",
    createdTo: params.get("createdTo") ?? "",
  };
}

function countActiveFilters(values: FilterValues): number {
  return Object.values(values).filter((v) => v.trim()).length;
}

type LogsPageClientProps = {
  initialResult: ListLogsResult;
};

export function LogsPageClient({ initialResult }: LogsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const result = initialResult;

  const [detailTarget, setDetailTarget] = useState<LogListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        type: "select",
        name: "actorType",
        label: "نوع عامل",
        options: [
          { value: "", label: "همه" },
          { value: "admin", label: "مدیر" },
          { value: "user", label: "کاربر" },
          { value: "system", label: "سیستم" },
        ],
      },
      {
        type: "text",
        name: "action",
        label: "عمل (جستجو)",
        dir: "ltr",
        placeholder: "request.approve",
      },
      {
        type: "select",
        name: "entityType",
        label: "نوع موجودیت",
        options: [
          { value: "", label: "همه" },
          ...ENTITY_TYPES.map((t) => ({ value: t, label: t })),
        ],
      },
      { type: "date", name: "createdFrom", label: "از تاریخ" },
      { type: "date", name: "createdTo", label: "تا تاریخ" },
    ],
    [],
  );

  const appliedFilters = useMemo(
    () => filterValuesFromParams(searchParams),
    [searchParams],
  );
  const activeFilterCount = countActiveFilters(appliedFilters);

  const syncUrl = useCallback(
    (patch: Partial<ReturnType<typeof parseLogsListQuery>>) => {
      const current = parseLogsListQuery(
        Object.fromEntries(searchParams.entries()),
      );
      const next = { ...current, ...patch };
      const sp = buildLogsSearchParams(next);
      const qs = sp.toString();
      router.replace(qs ? `/settings/logs?${qs}` : "/settings/logs");
    },
    [router, searchParams],
  );

  function applyFilters(draft: FilterValues) {
    syncUrl({
      actorType:
        draft.actorType === "admin" ||
        draft.actorType === "user" ||
        draft.actorType === "system"
          ? draft.actorType
          : undefined,
      action: draft.action || undefined,
      entityType: draft.entityType || undefined,
      createdFrom: draft.createdFrom || undefined,
      createdTo: draft.createdTo || undefined,
      page: 1,
    });
  }

  function resetFilters() {
    router.replace("/settings/logs");
  }

  function handlePageChange(nextPage: number) {
    syncUrl({ page: nextPage });
  }

  function actorLink(log: LogListItem): string | null {
    if (log.actorId == null) return null;
    if (log.actorType === "user") return `/users?highlight=${log.actorId}`;
    if (log.actorType === "admin") return "/admins";
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="لاگ‌های سیستم"
        description="رویدادهای ثبت‌شده توسط مدیر، کاربر و سیستم"
      />

      <ListCard>
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {result.total} رویداد
          </p>
          <AdvancedFilterSheet
            fields={filterFields}
            appliedValues={appliedFilters}
            onApply={applyFilters}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </div>

        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap gap-2 border-b px-4 pb-4">
            {appliedFilters.actorType ? (
              <FilterChip
                label={`عامل: ${ACTOR_LABELS[appliedFilters.actorType as LogActorType]}`}
                onClear={() => syncUrl({ actorType: undefined, page: 1 })}
              />
            ) : null}
            {appliedFilters.action ? (
              <FilterChip
                label={`عمل: ${appliedFilters.action}`}
                onClear={() => syncUrl({ action: undefined, page: 1 })}
              />
            ) : null}
            {appliedFilters.entityType ? (
              <FilterChip
                label={`موجودیت: ${appliedFilters.entityType}`}
                onClear={() => syncUrl({ entityType: undefined, page: 1 })}
              />
            ) : null}
          </div>
        ) : null}

        {result.items.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="لاگی یافت نشد"
            description="فیلترها را تغییر دهید"
          />
        ) : (
          <TableScroll>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>زمان</TableHead>
                <TableHead>عامل</TableHead>
                <TableHead>شناسه عامل</TableHead>
                <TableHead>عمل</TableHead>
                <TableHead>موجودیت</TableHead>
                <TableHead className="w-[80px]">
                  <span className="sr-only">جزئیات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((log) => {
                const href = actorLink(log);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFaDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.actorType === "admin"
                            ? "default"
                            : log.actorType === "user"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {ACTOR_LABELS[log.actorType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {href && log.actorId != null ? (
                        <Link
                          href={href}
                          className="text-primary hover:underline"
                        >
                          {log.actorDisplayName ?? `#${log.actorId}`}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {log.actorDisplayName ?? "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {getActionLabelFa(log.action)}
                      </span>
                      <TableLtrValue className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                        {log.action}
                      </TableLtrValue>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.entityType}
                      {log.entityId != null ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {" "}
                          #{log.entityId}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDetailTarget(log);
                          setDetailOpen(true);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
          pageSizeOptions={[20, 50]}
          onPageSizeChange={(pageSize) => syncUrl({ pageSize, page: 1 })}
        />
      </ListCard>

      <LogDetailSheet
        log={detailTarget}
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
