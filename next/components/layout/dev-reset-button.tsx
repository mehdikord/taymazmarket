"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DatabaseBackup, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DevResetButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  async function handleReset() {
    if (!confirm("دیتابیس به حالت seed اولیه بازگردد؟")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dev/reset", { method: "POST" });
      if (!res.ok) {
        toast.error("بازنشانی ناموفق");
        return;
      }
      toast.success("دیتابیس بازنشانی شد");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-start gap-2 px-0 text-xs text-amber-400 hover:bg-white/10 hover:text-amber-300"
        disabled={loading}
        onClick={handleReset}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <DatabaseBackup className="size-3.5" />
        )}
        بازنشانی DB
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-start gap-2 px-0 text-xs text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white"
        asChild
      >
        <Link href="/settings/dev">
          <Settings2 className="size-3.5" />
          ابزار dev
        </Link>
      </Button>
    </div>
  );
}
