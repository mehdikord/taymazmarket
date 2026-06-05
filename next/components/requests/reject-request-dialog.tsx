"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { RequestListItem } from "@/lib/services/requests";
import { requestRejectSchema } from "@/lib/validations/request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RejectRequestDialogProps = {
  request: RequestListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function RejectRequestDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: RejectRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleReject() {
    if (!request) return;
    const parsed = requestRejectSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.reason?.[0] ?? "دلیل نامعتبر");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: parsed.data.reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { message?: string }).message ?? "رد ناموفق");
        return;
      }
      toast.success("درخواست رد شد");
      handleOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const preview =
    request && reason.trim().length >= 3
      ? `❌ درخواست شما به کد ${request.trackingCode} به دلیل: «${reason.trim()}» توسط مدیریت رد شد. لطفاً درخواست جدید ثبت کنید.`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>رد درخواست</DialogTitle>
          <DialogDescription>
            کد پیگیری{" "}
            <span className="font-mono" dir="ltr">
              {request?.trackingCode}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">دلیل رد</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              placeholder="مثلاً: فاکتور نامعتبر است"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
          </div>

          {preview ? (
            <div className="rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">
                پیش‌نمایش پیام ربات (Mock)
              </p>
              {preview}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            انصراف
          </Button>
          <Button
            variant="destructive"
            className="gap-1"
            disabled={loading}
            onClick={handleReject}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            تأیید رد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
