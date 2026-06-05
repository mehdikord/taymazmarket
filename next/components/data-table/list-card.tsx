import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListCardProps = {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** قاب یکنواخت لیست‌های جدولی */
export function ListCard({ toolbar, children, footer, className }: ListCardProps) {
  return (
    <div className={cn("rounded-2xl border bg-card shadow-sm", className)}>
      {toolbar ? <div className="border-b p-4">{toolbar}</div> : null}
      {children}
      {footer}
    </div>
  );
}
