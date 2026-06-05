"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type FetchErrorAlertProps = {
  message?: string;
  onRetry?: () => void;
};

export function FetchErrorAlert({
  message = "بارگذاری داده ناموفق بود.",
  onRetry,
}: FetchErrorAlertProps) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="size-4" />
      <AlertTitle>خطا</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" className="gap-1" onClick={onRetry}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
