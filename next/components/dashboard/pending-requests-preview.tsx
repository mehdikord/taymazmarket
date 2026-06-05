import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { PendingRequestPreviewItem } from "@/lib/stats/dashboard";
import { formatNumber } from "@/lib/utils/format-number";
import { formatFaDate } from "@/lib/utils/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PendingRequestsPreviewProps = {
  requests: PendingRequestPreviewItem[];
};

export function PendingRequestsPreview({
  requests,
}: PendingRequestsPreviewProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-amber-600" />
            نیاز به بررسی
          </CardTitle>
          <CardDescription>
            درخواست‌های در انتظار تایید شما
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/requests/new">مشاهده همه</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
            درخواست در انتظاری وجود ندارد.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/requests/new?highlight=${request.trackingCode}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-transparent bg-muted/40 p-4 transition-colors hover:border-border hover:bg-muted/70"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{request.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFaDate(request.createdAt)} · کد{" "}
                      {request.trackingCode}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="tabular-nums">
                      {formatNumber(request.amount)}
                    </Badge>
                    <ArrowLeft className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
