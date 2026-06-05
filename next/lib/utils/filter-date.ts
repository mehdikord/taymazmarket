const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** تاریخ میلادی برای فیلتر دیتابیس: `YYYY-MM-DD` (محلی، بدون UTC) */
export function toGregorianYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseGregorianYmd(value: string): Date | undefined {
  if (!YMD_RE.test(value.trim())) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function parseFilterDateStart(ymd: string): Date {
  const [y, m, d] = ymd.trim().split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function parseFilterDateEnd(ymd: string): Date {
  const [y, m, d] = ymd.trim().split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

const jalaliDisplayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** نمایش شمسی برای UI (چیپ فیلتر، دکمه انتخاب) */
export function formatJalaliFilterLabel(ymd?: string): string {
  if (!ymd?.trim()) return "";
  const date = parseGregorianYmd(ymd);
  if (!date) return ymd;
  return jalaliDisplayFormatter.format(date);
}
