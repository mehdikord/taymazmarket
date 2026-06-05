import type { ExchangeRequestStatus } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";

type RequestStatusBadgeProps = {
  status: ExchangeRequestStatus;
};

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  return <StatusBadge variant={status} />;
}
