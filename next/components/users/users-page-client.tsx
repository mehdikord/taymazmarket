"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import type { User } from "@/lib/types";
import { getUserStatus } from "@/lib/types";
import type { ListUsersResult, UserTab } from "@/lib/services/users";
import {
  parseUsersListQueryFromString,
  usersListPath,
} from "@/lib/users/parse-list-query";
import { useReplaceUrl } from "@/hooks/use-replace-url";
import { hideOnMobile } from "@/lib/responsive";
import { formatFaDate } from "@/lib/utils/dates";
import { formatJalaliFilterLabel } from "@/lib/utils/filter-date";
import { formatMobileDisplay } from "@/lib/utils/mobile";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AdvancedFilterSheet,
  type FilterFieldConfig,
  type FilterValues,
} from "@/components/shared/advanced-filter-sheet";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ListCard } from "@/components/data-table/list-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableLtrValue } from "@/components/shared/table-ltr-value";
import { TableScroll } from "@/components/shared/table-scroll";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FILTER_FIELDS: FilterFieldConfig[] = [
  { type: "text", name: "mobile", label: "موبایل", placeholder: "98912...", dir: "ltr" },
  { type: "text", name: "name", label: "نام" },
  {
    type: "select",
    name: "hasCode",
    label: "کد تایید",
    options: [
      { value: "", label: "همه" },
      { value: "true", label: "دارد" },
      { value: "false", label: "ندارد" },
    ],
  },
  { type: "text", name: "chatId", label: "Chat ID", dir: "ltr" },
  { type: "date", name: "createdFrom", label: "از تاریخ ثبت" },
  { type: "date", name: "createdTo", label: "تا تاریخ ثبت" },
];

type UsersPageClientProps = {
  initialResult: ListUsersResult;
  tabCounts: Record<UserTab, number>;
};

function filterValuesFromQuery(
  params: URLSearchParams,
): FilterValues {
  return {
    mobile: params.get("mobile") ?? "",
    name: params.get("name") ?? "",
    hasCode: params.get("hasCode") ?? "",
    chatId: params.get("chatId") ?? "",
    createdFrom: params.get("createdFrom") ?? "",
    createdTo: params.get("createdTo") ?? "",
  };
}

function countActiveFilters(values: FilterValues): number {
  return Object.values(values).filter((v) => v.trim()).length;
}

export function UsersPageClient({
  initialResult,
  tabCounts,
}: UsersPageClientProps) {
  const router = useRouter();
  const { searchParams, searchParamsKey, syncUrl } = useReplaceUrl({
    toPath: usersListPath,
    parse: parseUsersListQueryFromString,
  });

  const tab = (searchParams.get("tab") as UserTab | null) ?? "all";
  const validTab: UserTab =
    tab === "active" || tab === "inactive" ? tab : "all";
  const highlightId = Number(searchParams.get("highlight"));
  const highlightedUserId =
    Number.isInteger(highlightId) && highlightId > 0 ? highlightId : null;

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const appliedFilters = useMemo(
    () => filterValuesFromQuery(searchParams),
    [searchParams],
  );
  const activeFilterCount = countActiveFilters(appliedFilters);

  const isFirstSearchSync = useRef(true);
  useEffect(() => {
    if (isFirstSearchSync.current) {
      isFirstSearchSync.current = false;
      return;
    }
    const urlQ = new URLSearchParams(searchParamsKey).get("q") ?? "";
    const nextQ = debouncedSearch.trim();
    if (urlQ === nextQ) return;
    syncUrl({ q: nextQ || undefined, page: 1 });
  }, [debouncedSearch, searchParamsKey, syncUrl]);

  function handleTabChange(value: string) {
    const nextTab = value as UserTab;
    syncUrl({ tab: nextTab, page: 1 });
  }

  function handlePageChange(nextPage: number) {
    syncUrl({ page: nextPage });
  }

  function applyFilters(draft: FilterValues) {
    syncUrl({
      mobile: draft.mobile || undefined,
      name: draft.name || undefined,
      hasCode:
        draft.hasCode === "true" || draft.hasCode === "false"
          ? draft.hasCode
          : undefined,
      chatId: draft.chatId || undefined,
      createdFrom: draft.createdFrom || undefined,
      createdTo: draft.createdTo || undefined,
      page: 1,
    });
  }

  function resetFilters() {
    syncUrl({
      mobile: undefined,
      name: undefined,
      hasCode: undefined,
      chatId: undefined,
      createdFrom: undefined,
      createdTo: undefined,
      page: 1,
    });
  }

  const result = initialResult;

  return (
    <div className="space-y-6">
      <PageHeader
        title="کاربران"
        description="مشتریان ربات تلگرام — فعال بودن بر اساس کد تایید"
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="size-4" />
            کاربر جدید
          </Button>
        }
      />

      <ListCard>
        <div className="border-b p-4">
          <Tabs value={validTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="all">همه ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="active">فعال ({tabCounts.active})</TabsTrigger>
              <TabsTrigger value="inactive">
                غیرفعال ({tabCounts.inactive})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو نام، موبایل یا یوزرنیم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <AdvancedFilterSheet
            fields={FILTER_FIELDS}
            appliedValues={appliedFilters}
            onApply={applyFilters}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </div>

        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap gap-2 border-b px-4 pb-4">
            {appliedFilters.mobile ? (
              <FilterChip
                label={`موبایل: ${appliedFilters.mobile}`}
                onClear={() => syncUrl({ mobile: undefined, page: 1 })}
              />
            ) : null}
            {appliedFilters.name ? (
              <FilterChip
                label={`نام: ${appliedFilters.name}`}
                onClear={() => syncUrl({ name: undefined, page: 1 })}
              />
            ) : null}
            {appliedFilters.hasCode ? (
              <FilterChip
                label={
                  appliedFilters.hasCode === "true"
                    ? "دارای کد تایید"
                    : "بدون کد تایید"
                }
                onClear={() => syncUrl({ hasCode: undefined, page: 1 })}
              />
            ) : null}
            {appliedFilters.chatId ? (
              <FilterChip
                label={`Chat: ${appliedFilters.chatId}`}
                onClear={() => syncUrl({ chatId: undefined, page: 1 })}
              />
            ) : null}
            {(appliedFilters.createdFrom || appliedFilters.createdTo) ? (
              <FilterChip
                label={`تاریخ: ${formatJalaliFilterLabel(appliedFilters.createdFrom) || "…"} — ${formatJalaliFilterLabel(appliedFilters.createdTo) || "…"}`}
                onClear={() =>
                  syncUrl({
                    createdFrom: undefined,
                    createdTo: undefined,
                    page: 1,
                  })
                }
              />
            ) : null}
          </div>
        ) : null}

        {result.items.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="کاربری یافت نشد"
            description="فیلترها را تغییر دهید یا کاربر جدید اضافه کنید"
          />
        ) : (
          <TableScroll>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>موبایل</TableHead>
                <TableHead className={hideOnMobile}>تلگرام</TableHead>
                <TableHead className={hideOnMobile}>Chat ID</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className={hideOnMobile}>تاریخ ثبت</TableHead>
                <TableHead className="w-[100px]">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((user) => {
                const status = getUserStatus(user);
                return (
                  <TableRow
                    key={user.id}
                    className={
                      highlightedUserId === user.id
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : undefined
                    }
                  >
                    <TableCell>{user.name ?? "—"}</TableCell>
                    <TableCell>
                      <TableLtrValue className="font-mono text-sm">
                        {formatMobileDisplay(user.mobile)}
                      </TableLtrValue>
                    </TableCell>
                    <TableCell className={hideOnMobile}>
                      <TableLtrValue className="text-sm">
                        {user.telegramUsername
                          ? `@${user.telegramUsername}`
                          : "—"}
                      </TableLtrValue>
                    </TableCell>
                    <TableCell className={hideOnMobile}>
                      <TableLtrValue className="font-mono text-xs">
                        {user.telegramChatId ?? "—"}
                      </TableLtrValue>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={status} />
                    </TableCell>
                    <TableCell
                      className={`text-sm text-muted-foreground ${hideOnMobile}`}
                    >
                      {formatFaDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(user);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>ویرایش</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteTarget(user);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
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
        />
      </ListCard>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSuccess={() => router.refresh()}
      />

      <DeleteUserDialog
        user={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.refresh()}
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
