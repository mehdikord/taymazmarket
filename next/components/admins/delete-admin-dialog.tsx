"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminPublic } from "@/lib/types";
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

type DeleteAdminDialogProps = {
  admin: AdminPublic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteAdminDialog({
  admin,
  open,
  onOpenChange,
  onSuccess,
}: DeleteAdminDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!admin) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admins/${admin.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(
          (data as { message?: string }).message ?? "حذف ناموفق بود",
        );
        return;
      }

      toast.success("مدیر حذف شد");
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
          <AlertDialogTitle>حذف مدیر</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از حذف «{admin?.name}» مطمئن هستید؟ این عمل قابل بازگشت در
            Mock نیست (soft delete).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>انصراف</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            حذف
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
