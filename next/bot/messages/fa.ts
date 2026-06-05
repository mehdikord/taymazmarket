/** متن‌های ربات — PRD §۸ */
export const t = {
  welcome:
    "👋 به ربات تبدیل ارز تایماز مارکت خوش آمدید!\n\nبرای استفاده از خدمات، دکمه «احراز هویت» را بزنید.",
  setupPlaceholder:
    "👋 به ربات تبدیل ارز تایماز مارکت خوش آمدید!\n\nبرای استفاده از خدمات، دکمه «احراز هویت» را بزنید.",
  authButton: "🔐 احراز هویت",
  askPhone:
    "📱 لطفاً شماره موبایل را **با کد کشور** ارسال کنید.\n\nمثال: `989123456789`",
  invalidPhone:
    "⚠️ فرمت شماره صحیح نیست. لطفاً موبایل را با کد کشور ارسال کنید (مثال: `989123456789`).",
  accountCreated:
    "✅ حساب شما در سیستم ایجاد شد.\n\nبرای دریافت کد تایید با مدیریت تماس بگیرید، سپس مجدداً «احراز هویت» را بزنید.",
  askCode: "🔑 کد تایید خود را ارسال کنید.",
  wrongCode: "❌ کد تایید نادرست است. دوباره تلاش کنید.",
  wrongCodeWithAttempts: (left: number) =>
    `❌ کد تایید نادرست است. ${left} تلاش باقی مانده.`,
  authLocked:
    "🔒 به دلیل تلاش‌های مکرر، ورود موقتاً مسدود شد. حدود ۱۵ دقیقه بعد دوباره «احراز هویت» را بزنید.",
  authSuccess: "✅ احراز هویت با موفقیت انجام شد.",
  needAuth: "🔐 ابتدا از دکمه «احراز هویت» استفاده کنید.",
  accountDeactivated:
    "⚠️ حساب شما غیرفعال شده است. برای دریافت کد تایید با مدیریت تماس بگیرید.",
  mainMenuHint: "از منوی زیر یکی از گزینه‌ها را انتخاب کنید:",
  menuNewRequest: "📝 ثبت درخواست جدید",
  menuHistory: "📋 تاریخچه درخواست‌ها",
  cancel: "❌ لغو",
  cancelled: "عملیات لغو شد. از منوی زیر ادامه دهید:",
  temporaryError: "⚠️ خطای موقت. لطفاً چند لحظه بعد دوباره تلاش کنید.",
  unknownMessage: "از دکمه‌های منو یا «احراز هویت» استفاده کنید.",
  invalidInvoiceInput:
    "پیام دریافتی نامعتبر است ! لطفا عکس مورد نظر را ارسال کنید",
  requestApproved: (trackingCode: string) =>
    `✅ درخواست شما به کد \`${trackingCode}\` تأیید و انجام شد.`,
  requestRejected: (trackingCode: string, reason: string) =>
    `❌ درخواست شما به کد \`${trackingCode}\` به دلیل: ${reason}\n\nلطفاً درخواست جدید ثبت کنید.`,
} as const;

export type HistoryDetailInput = {
  trackingCode: string;
  sourceTitle: string;
  targetTitle: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankAccount: string;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

const HISTORY_STATUS: Record<
  HistoryDetailInput["status"],
  { emoji: string; label: string }
> = {
  pending: { emoji: "⏳", label: "در انتظار تأیید" },
  approved: { emoji: "✅", label: "تأیید شده" },
  rejected: { emoji: "❌", label: "رد شده" },
};

function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatHistoryAmount(amount: number): string {
  return amount.toLocaleString("en-US");
}

/** پیام جزئیات درخواست — تاریخچه ربات */
export function formatHistoryDetail(detail: HistoryDetailInput): string {
  const status = HISTORY_STATUS[detail.status];
  const lines = [
    "📄 *جزئیات درخواست*",
    "──────────────",
    "",
    "🔖 *کد پیگیری*",
    `\`${detail.trackingCode}\``,
    "",
    "💱 *مسیر تبدیل*",
    `${detail.sourceTitle} ➜ ${detail.targetTitle}`,
    "",
    "💰 *مبلغ*",
    `\`${formatHistoryAmount(detail.amount)}\``,
    "",
    "📊 *وضعیت*",
    `${status.emoji} ${status.label}`,
    "",
    "🏦 *حساب بانکی*",
    `\`${detail.bankAccount}\``,
    "",
    "📅 *تاریخ ثبت*",
    formatHistoryDate(detail.createdAt),
  ];

  if (detail.reviewedAt) {
    lines.push("", "🕐 *تاریخ بررسی*", formatHistoryDate(detail.reviewedAt));
  }

  if (detail.status === "rejected" && detail.rejectionReason) {
    lines.push(
      "",
      "⚠️ *دلیل رد*",
      detail.rejectionReason,
    );
  }

  if (detail.status === "pending") {
    lines.push("", "💬 نتیجه بررسی از همین ربات اطلاع داده می‌شود.");
  }

  lines.push("", "──────────────");
  return lines.join("\n");
}
