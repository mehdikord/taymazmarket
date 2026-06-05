"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DatabaseBackup, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DevToolsPanelProps = {
  stats: {
    admins: number;
    users: number;
    activeUsers: number;
    currencies: number;
    requests: number;
    pendingRequests: number;
    logs: number;
  };
};

export function DevToolsPanel({ stats }: DevToolsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirm("همه داده دیتابیس به seed اولیه بازگردد؟")) return;
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
    <div className="space-y-6">
      <PageHeader
        title="ابزار توسعه"
        description="فقط در محیط development — هرگز در production"
      />

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">بازنشانی داده</CardTitle>
          <CardDescription>
            معادل دکمه footer سایدبار — `clearSeedData` + seed مجدد در MySQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2"
            disabled={loading}
            onClick={handleReset}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DatabaseBackup className="size-4" />
            )}
            بازنشانی دیتابیس
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آمار seed فعلی</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Stat label="مدیران" value={stats.admins} />
            <Stat label="کاربران" value={stats.users} />
            <Stat label="کاربران فعال" value={stats.activeUsers} />
            <Stat label="ارزها" value={stats.currencies} />
            <Stat label="درخواست‌ها" value={stats.requests} />
            <Stat label="در انتظار" value={stats.pendingRequests} />
            <Stat label="لاگ‌ها" value={stats.logs} />
          </dl>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          بازگشت به داشبورد
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
