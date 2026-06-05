"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CurrencyListItem } from "@/lib/services/currencies";
import { CurrencyFormDialog } from "@/components/settings/currency-form-dialog";
import { DeleteCurrencyDialog } from "@/components/settings/delete-currency-dialog";
import { ListCard } from "@/components/data-table/list-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableLtrValue } from "@/components/shared/table-ltr-value";
import { TableScroll } from "@/components/shared/table-scroll";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CurrenciesPageClientProps = {
  initialItems: CurrencyListItem[];
};

export function CurrenciesPageClient({
  initialItems,
}: CurrenciesPageClientProps) {
  const router = useRouter();
  const items = initialItems;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CurrencyListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CurrencyListItem | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function toggleActive(currency: CurrencyListItem, next: boolean) {
    setTogglingId(currency.id);
    try {
      const res = await fetch(`/api/currencies/${currency.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { message?: string }).message ?? "خطا در به‌روزرسانی");
        return;
      }
      toast.success(next ? "ارز فعال شد" : "ارز غیرفعال شد");
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ارزها"
        description="مدیریت ارزهای قابل انتخاب در ربات و درخواست‌ها"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            ارز جدید
          </Button>
        }
      />

      <ListCard>
        {items.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="ارزی ثبت نشده"
            description="اولین ارز را اضافه کنید"
          />
        ) : (
          <TableScroll>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان</TableHead>
                <TableHead>شناسه</TableHead>
                <TableHead>کشور</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>ترتیب</TableHead>
                <TableHead className="w-[100px]">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">{currency.title}</TableCell>
                  <TableCell>
                    <TableLtrValue className="font-mono text-sm">
                      {currency.slug}
                    </TableLtrValue>
                  </TableCell>
                  <TableCell>{currency.countryNameFa}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={currency.isActive}
                        disabled={togglingId === currency.id}
                        onCheckedChange={(v) =>
                          toggleActive(currency, v === true)
                        }
                        aria-label={
                          currency.isActive ? "غیرفعال کردن" : "فعال کردن"
                        }
                      />
                      <Badge
                        variant={currency.isActive ? "default" : "secondary"}
                        className={
                          currency.isActive
                            ? "bg-emerald-600 hover:bg-emerald-600"
                            : undefined
                        }
                      >
                        {currency.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TableLtrValue className="text-sm text-muted-foreground">
                      {currency.sortOrder ?? "—"}
                    </TableLtrValue>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(currency);
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
                              setDeleteTarget(currency);
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
              ))}
            </TableBody>
          </Table>
          </TableScroll>
        )}
      </ListCard>

      <CurrencyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currency={editing}
        onSuccess={() => router.refresh()}
      />

      <DeleteCurrencyDialog
        currency={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
