"use client";

import { useState } from "react";
import { Loader2, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { normalizeMobile } from "@/lib/utils/mobile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      toast.error("فرمت شماره موبایل صحیح نیست");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: normalized, password }),
      });

      if (!res.ok) {
        toast.error("اطلاعات نادرست است");
        return;
      }

      toast.success("ورود موفق");
      // بارگذاری کامل صفحه تا کوکی session در RSC/layout اعمال شود
      window.location.assign("/");
    } catch {
      toast.error("خطا در برقراری ارتباط");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          TM
        </div>
        <CardTitle className="text-2xl">پنل مدیریت تایماز</CardTitle>
        <CardDescription>
          برای ورود، شماره موبایل (با کد کشور، بدون +) و رمز عبور را وارد
          کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">شماره موبایل</Label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                placeholder="989123456789"
                className="pr-10"
                dir="ltr"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              مثال ایران: 989121111111
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                className="pr-10"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال ورود...
              </>
            ) : (
              "ورود به سیستم"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
