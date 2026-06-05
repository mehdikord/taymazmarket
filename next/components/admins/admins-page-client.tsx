"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import type { AdminPublic } from "@/lib/types";
import { formatFaDate } from "@/lib/utils/dates";
import { formatMobileDisplay } from "@/lib/utils/mobile";
import { useDebounce } from "@/hooks/use-debounce";
import { AdminFormDialog } from "@/components/admins/admin-form-dialog";
import { DeleteAdminDialog } from "@/components/admins/delete-admin-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { TableLtrValue } from "@/components/shared/table-ltr-value";
import { ListCard } from "@/components/data-table/list-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FetchErrorAlert } from "@/components/shared/fetch-error-alert";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AdminsPageClientProps = {
  currentAdminId: number;
  initialItems: AdminPublic[];
};

export function AdminsPageClient({
  currentAdminId,
  initialItems,
}: AdminsPageClientProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [items, setItems] = useState<AdminPublic[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPublic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPublic | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = debouncedSearch
        ? `?q=${encodeURIComponent(debouncedSearch)}`
        : "";
      const res = await fetch(`/api/admins${params}`);
      if (!res.ok) {
        setFetchError(true);
        return;
      }
      const data = (await res.json()) as { items: AdminPublic[] };
      setItems(data.items);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  const isFirstSearchEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    void fetchAdmins();
  }, [debouncedSearch, fetchAdmins]);

  const openEdit = useCallback((admin: AdminPublic) => {
    setEditing(admin);
    setFormOpen(true);
  }, []);

  const openDelete = useCallback((admin: AdminPublic) => {
    setDeleteTarget(admin);
    setDeleteOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<AdminPublic>[]>(
    () => [
      {
        accessorKey: "name",
        header: "نام",
        cell: ({ row }) => {
          const admin = row.original;
          const isSelf = admin.id === currentAdminId;
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">{admin.name}</span>
              {isSelf ? (
                <Badge variant="secondary" className="text-[10px]">
                  شما
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "mobile",
        header: "موبایل",
        cell: ({ row }) => (
          <TableLtrValue className="font-mono text-sm">
            {formatMobileDisplay(row.original.mobile)}
          </TableLtrValue>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "تاریخ ایجاد",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatFaDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "عملیات",
        cell: ({ row }) => {
          const admin = row.original;
          const isSelf = admin.id === currentAdminId;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(admin)}
                aria-label="ویرایش"
              >
                <Pencil className="size-4" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={isSelf}
                      onClick={() => openDelete(admin)}
                      aria-label="حذف"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {isSelf ? (
                  <TooltipContent>
                    امکان حذف حساب خودتان وجود ندارد
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [currentAdminId, openEdit, openDelete],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیران سیستم"
        description="مدیریت حساب‌های دسترسی به پنل"
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            مدیر جدید
          </Button>
        }
      />

      <ListCard
        toolbar={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو نام یا موبایل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              {loading ? "..." : `${items.length} مدیر`}
            </div>
          </div>
        }
      >
        {fetchError ? (
          <FetchErrorAlert onRetry={() => void fetchAdmins()} />
        ) : (
          <DataTable
            columns={columns}
            data={items}
            isLoading={loading}
            emptyState={
              <EmptyState
                icon={UserCog}
                title="مدیری یافت نشد"
                description={
                  debouncedSearch
                    ? "عبارت جستجو را تغییر دهید"
                    : "اولین مدیر را اضافه کنید"
                }
                action={
                  !debouncedSearch ? (
                    <Button onClick={openCreate} className="gap-2">
                      <Plus className="size-4" />
                      مدیر جدید
                    </Button>
                  ) : undefined
                }
                className="border-0 bg-transparent"
              />
            }
          />
        )}
      </ListCard>

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        admin={editing}
        onSuccess={fetchAdmins}
      />

      <DeleteAdminDialog
        admin={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={fetchAdmins}
      />
    </div>
  );
}
