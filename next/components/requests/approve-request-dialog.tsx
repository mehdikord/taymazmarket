"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RequestListItem } from "@/lib/services/requests";
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

type ApproveRequestDialogProps = {
  request: RequestListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ApproveRequestDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ApproveRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showBotNote, setShowBotNote] = useState(false);

  async function handleApprove() {
    if (!request) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/approve`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { message?: string }).message ?? "تایید ناموفق");
        return;
      }
      toast.success("درخواست تایید شد");
      setShowBotNote(true);
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setShowBotNote(false);
          onOpenChange(v);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید درخواست</AlertDialogTitle>
            <AlertDialogDescription>
              درخواست با کد پیگیری{" "}
              <span className="font-mono" dir="ltr">
                {request?.trackingCode}
              </span>{" "}
              تایید شود؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>انصراف</AlertDialogCancel>
            <Button
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
              onClick={handleApprove}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              تایید
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showBotNote ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-lg dark:bg-emerald-950/80 dark:text-emerald-100">
          <p className="font-medium">حالت Mock</p>
          <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/90">
            در محیط واقعی ربات به کاربر پیام می‌دهد: «درخواست شما به کد{" "}
            {request?.trackingCode} تایید و انجام شد.»
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowBotNote(false)}
          >
            بستن
          </Button>
        </div>
      ) : null}
    </>
  );
}
