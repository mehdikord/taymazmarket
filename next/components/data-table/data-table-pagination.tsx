"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DataTablePaginationProps = {
  state: PaginationState;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
};

export function getPaginationRange(state: PaginationState): {
  rangeStart: number;
  rangeEnd: number;
} {
  const rangeStart =
    state.total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const rangeEnd = Math.min(state.page * state.pageSize, state.total);
  return { rangeStart, rangeEnd };
}

export function DataTablePagination({
  state,
  onPageChange,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
}: DataTablePaginationProps) {
  if (state.total === 0) return null;

  const { rangeStart, rangeEnd } = getPaginationRange(state);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        نمایش {rangeStart} تا {rangeEnd} از {state.total}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>در صفحه</span>
            <Select
              value={String(state.pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={state.page <= 1}
            onClick={() => onPageChange(state.page - 1)}
            aria-label="صفحه قبل"
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="min-w-[4rem] text-center text-sm">
            صفحه {state.page} از {state.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={state.page >= state.totalPages}
            onClick={() => onPageChange(state.page + 1)}
            aria-label="صفحه بعد"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
