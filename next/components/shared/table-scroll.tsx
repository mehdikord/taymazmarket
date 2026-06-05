import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TableScrollProps = {
  children: ReactNode;
  className?: string;
};

/** افقی اسکرول جدول در موبایل */
export function TableScroll({ children, className }: TableScrollProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>{children}</div>
  );
}
