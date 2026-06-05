import {
  parseFilterDateEnd,
  parseFilterDateStart,
} from "@/lib/utils/filter-date";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Prisma `createdAt` filter from panel date params (`YYYY-MM-DD` میلادی). */
export function createdAtRange(
  from?: string,
  to?: string,
): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};
  if (from?.trim()) {
    range.gte = YMD_RE.test(from.trim())
      ? parseFilterDateStart(from)
      : new Date(from);
  }
  if (to?.trim()) {
    range.lte = YMD_RE.test(to.trim())
      ? parseFilterDateEnd(to)
      : (() => {
          const end = new Date(to);
          end.setHours(23, 59, 59, 999);
          return end;
        })();
  }
  if (range.gte === undefined && range.lte === undefined) {
    return undefined;
  }
  return range;
}

export function createdAtWhere(
  from?: string,
  to?: string,
): { createdAt?: { gte?: Date; lte?: Date } } {
  const range = createdAtRange(from, to);
  return range ? { createdAt: range } : {};
}
