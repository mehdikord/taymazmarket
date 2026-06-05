import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PanelNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
      <FileQuestion className="size-12 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">صفحه یافت نشد</h2>
        <p className="text-sm text-muted-foreground">
          آدرس واردشده در پنل وجود ندارد.
        </p>
      </div>
      <Button asChild>
        <Link href="/">بازگشت به داشبورد</Link>
      </Button>
    </div>
  );
}
