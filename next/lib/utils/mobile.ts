import { toEnglishDigits } from "./persian-digits";

/** نرمال‌سازی موبایل: کد کشور بدون + (مثال ایران: 989123456789) */
export function normalizeMobile(raw: string): string | null {
  let value = toEnglishDigits(raw.trim());
  value = value.replace(/[\s\-()]/g, "");
  if (value.startsWith("+")) {
    value = value.slice(1);
  }

  if (!/^\d+$/.test(value) || value.length < 10) {
    return null;
  }

  if (value.startsWith("00")) {
    value = value.slice(2);
  }

  // ایران: 09xxxxxxxxx → 98xxxxxxxxxx
  if (value.startsWith("09") && value.length === 11) {
    value = `98${value.slice(1)}`;
  }
  if (value.startsWith("9") && value.length === 10) {
    value = `98${value}`;
  }

  if (value.length < 10 || value.length > 15) {
    return null;
  }

  return value;
}

/** نمایش UI — گروه‌بندی ساده از راست */
export function formatMobileDisplay(mobile: string): string {
  if (mobile.startsWith("98") && mobile.length === 12) {
    return `${mobile.slice(0, 2)} ${mobile.slice(2, 5)} ${mobile.slice(5, 8)} ${mobile.slice(8)}`;
  }
  return mobile.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}
