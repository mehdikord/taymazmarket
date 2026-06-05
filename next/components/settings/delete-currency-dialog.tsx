"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CurrencyListItem } from "@/lib/services/currencies";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteCurrencyDialogProps = {
  currency: CurrencyListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteCurrencyDialog({
  currency,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCurrencyDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!currency) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/currencies/${currency.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { message?: string }).message ?? "حذف ناموفق بود",
        );
        return;
      }
      toast.success("ارز حذف شد");
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف ارز</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از حذف «{currency?.title}» ({currency?.slug}) مطمئن هستید؟ اگر
            در درخواست‌ها استفاده شده باشد، حذف امکان‌پذیر نیست.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>انصراف</AlertDialogCancel>
          <Button variant="destructive" disabled={loading} onClick={handleDelete}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            حذف
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
