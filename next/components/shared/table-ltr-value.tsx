import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TableLtrValueProps = {
  children: ReactNode;
  className?: string;
};

/**
 * اعداد / موبایل / شناسه لاتین داخل جدول RTL.
 * `dir="ltr"` فقط روی متن است، نه روی `<td>` — تا هدر و محتوا هم‌تراز بمانند.
 */
export function TableLtrValue({ children, className }: TableLtrValueProps) {
  return (
    <span
      dir="ltr"
      className={cn("inline-block max-w-full text-start [unicode-bidi:isolate]", className)}
    >
      {children}
    </span>
  );
}
