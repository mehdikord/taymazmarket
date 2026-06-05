"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type PanelErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PanelError({ error, reset }: PanelErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">خطای غیرمنتظره</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          مشکلی در بارگذاری این بخش پیش آمد. می‌توانید دوباره تلاش کنید یا به
          داشبورد برگردید.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="size-4" />
          تلاش مجدد
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">داشبورد</Link>
        </Button>
      </div>
    </div>
  );
}
