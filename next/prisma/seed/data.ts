import { COUNTRIES } from "../../config/countries";
import { LOG_ACTIONS } from "../../lib/logging/actions";
import type { ExchangeRequestStatus } from "../../lib/generated/prisma/client";

export { COUNTRIES, LOG_ACTIONS };

export const ADMIN_SEEDS = [
  {
    name: "مدیر اصلی",
    mobile: "989121111111",
    password: "admin123",
    daysAgoCreated: 60,
  },
  {
    name: "مدیر پشتیبان",
    mobile: "989122222222",
    password: "admin456",
    daysAgoCreated: 45,
  },
] as const;

export const USER_SEEDS = [
  {
    name: "علی رضایی",
    telegramChatId: BigInt(100001),
    telegramUsername: "ali_rezaei",
    mobile: "989121000001",
    verificationCode: "A1B2C3",
    notes: "مشتری VIP",
    daysAgoCreated: 40,
  },
  {
    name: "مریم احمدی",
    telegramChatId: BigInt(100002),
    telegramUsername: "maryam_a",
    mobile: "989121000002",
    verificationCode: "D4E5F6",
    notes: null,
    daysAgoCreated: 35,
  },
  {
    name: "Kemal Yilmaz",
    telegramChatId: BigInt(100003),
    telegramUsername: "kemal_y",
    mobile: "905551234567",
    verificationCode: "G7H8I9",
    notes: "مشتری ترکیه",
    daysAgoCreated: 30,
  },
  {
    name: "سارا موسوی",
    telegramChatId: BigInt(100004),
    telegramUsername: "sara_m",
    mobile: "989121000004",
    verificationCode: "J1K2L3",
    notes: null,
    daysAgoCreated: 25,
  },
  {
    name: "Reza Karimi",
    telegramChatId: BigInt(100005),
    telegramUsername: "reza_k",
    mobile: "989121000005",
    verificationCode: "M4N5O6",
    notes: null,
    daysAgoCreated: 20,
  },
  {
    name: "کاربر جدید ربات",
    telegramChatId: BigInt(100006),
    telegramUsername: "new_bot_user",
    mobile: "989121000006",
    verificationCode: null,
    notes: "ثبت از ربات — منتظر کد",
    daysAgoCreated: 10,
  },
  {
    name: "حسین نوری",
    telegramChatId: BigInt(100007),
    telegramUsername: "h_nouri",
    mobile: "989121000007",
    verificationCode: null,
    notes: null,
    daysAgoCreated: 8,
  },
  {
    name: "مشتری ثبت‌شده مدیر",
    telegramChatId: null,
    telegramUsername: null,
    mobile: "989121000008",
    verificationCode: null,
    notes: "ثبت دستی بدون تلگرام",
    daysAgoCreated: 15,
  },
  {
    name: "Fatma Demir",
    telegramChatId: BigInt(100009),
    telegramUsername: "fatma_d",
    mobile: "905559998877",
    verificationCode: null,
    notes: null,
    daysAgoCreated: 5,
  },
  {
    name: "زهرا کاظمی",
    telegramChatId: null,
    telegramUsername: null,
    mobile: "989121000010",
    verificationCode: null,
    notes: "در انتظار فعال‌سازی",
    daysAgoCreated: 2,
  },
] as const;

export const CURRENCY_SEEDS = [
  { title: "ریال", slug: "rials", countryCode: "IR", sortOrder: 1 },
  { title: "لیر", slug: "lira", countryCode: "TR", sortOrder: 2 },
  { title: "دلار", slug: "usd", countryCode: "US", sortOrder: 3 },
  { title: "یورو", slug: "eur", countryCode: "DE", sortOrder: 4 },
] as const;

export const BANK_ACCOUNT_SEEDS = [
  {
    userMobile: "989121000001",
    currencySlug: "rials",
    accountNumber: "6037991234567890",
    label: "کارت اصلی",
    daysAgoCreated: 20,
  },
  {
    userMobile: "989121000001",
    currencySlug: "lira",
    accountNumber: "TR330006100519786457841326",
    label: "حساب لیر",
    daysAgoCreated: 18,
  },
  {
    userMobile: "989121000002",
    currencySlug: "rials",
    accountNumber: "5022291234567891",
    label: null,
    daysAgoCreated: 15,
  },
  {
    userMobile: "905551234567",
    currencySlug: "lira",
    accountNumber: "TR760006400000123456789012",
    label: "کارت ترکیه",
    daysAgoCreated: 12,
  },
  {
    userMobile: "905551234567",
    currencySlug: "usd",
    accountNumber: "US1234567890123456",
    label: "حساب دلار",
    daysAgoCreated: 10,
  },
  {
    userMobile: "989121000004",
    currencySlug: "rials",
    accountNumber: "6104331234567892",
    label: null,
    daysAgoCreated: 8,
  },
  {
    userMobile: "989121000005",
    currencySlug: "usd",
    accountNumber: "DE89370400440532013000",
    label: "شبا یورو/دلار",
    daysAgoCreated: 6,
  },
] as const;

export type RequestSeedSpec = {
  userMobile: string;
  sourceSlug: string;
  targetSlug: string;
  amount: number;
  bankAccount: string;
  invoice: string;
  status: ExchangeRequestStatus;
  trackingCode: string;
  daysAgo: number;
  rejectionReason?: string;
  reviewed?: boolean;
};

export const REQUEST_SEEDS: RequestSeedSpec[] = [
  { userMobile: "989121000001", sourceSlug: "lira", targetSlug: "rials", amount: 30000, bankAccount: "6037991234567890", invoice: "/mock-invoices/1.jpg", status: "pending", trackingCode: "12345601", daysAgo: 1 },
  { userMobile: "989121000002", sourceSlug: "usd", targetSlug: "rials", amount: 500, bankAccount: "5022291234567891", invoice: "/mock-invoices/2.jpg", status: "pending", trackingCode: "12345602", daysAgo: 2 },
  { userMobile: "905551234567", sourceSlug: "lira", targetSlug: "usd", amount: 15000, bankAccount: "US1234567890123456", invoice: "/mock-invoices/3.jpg", status: "pending", trackingCode: "12345603", daysAgo: 0 },
  { userMobile: "989121000004", sourceSlug: "eur", targetSlug: "rials", amount: 200, bankAccount: "6104331234567892", invoice: "/mock-invoices/1.jpg", status: "pending", trackingCode: "12345604", daysAgo: 3 },
  { userMobile: "989121000005", sourceSlug: "rials", targetSlug: "lira", amount: 50000000, bankAccount: "TR760006400000123456789012", invoice: "/mock-invoices/2.jpg", status: "pending", trackingCode: "12345605", daysAgo: 1 },
  { userMobile: "989121000001", sourceSlug: "usd", targetSlug: "rials", amount: 1000, bankAccount: "6037991234567890", invoice: "/mock-invoices/3.jpg", status: "approved", trackingCode: "12345606", daysAgo: 10, reviewed: true },
  { userMobile: "989121000002", sourceSlug: "lira", targetSlug: "rials", amount: 25000, bankAccount: "5022291234567891", invoice: "/mock-invoices/1.jpg", status: "approved", trackingCode: "12345607", daysAgo: 12, reviewed: true },
  { userMobile: "905551234567", sourceSlug: "rials", targetSlug: "lira", amount: 10000000, bankAccount: "TR330006100519786457841326", invoice: "/mock-invoices/2.jpg", status: "approved", trackingCode: "12345608", daysAgo: 15, reviewed: true },
  { userMobile: "989121000004", sourceSlug: "eur", targetSlug: "rials", amount: 350, bankAccount: "6104331234567892", invoice: "/mock-invoices/3.jpg", status: "approved", trackingCode: "12345609", daysAgo: 18, reviewed: true },
  { userMobile: "989121000005", sourceSlug: "usd", targetSlug: "eur", amount: 800, bankAccount: "DE89370400440532013000", invoice: "/mock-invoices/1.jpg", status: "approved", trackingCode: "12345610", daysAgo: 20, reviewed: true },
  { userMobile: "989121000001", sourceSlug: "lira", targetSlug: "rials", amount: 12000, bankAccount: "6037991234567890", invoice: "/mock-invoices/2.jpg", status: "rejected", trackingCode: "12345611", daysAgo: 8, rejectionReason: "فاکتور نامعتبر است", reviewed: true },
  { userMobile: "989121000002", sourceSlug: "usd", targetSlug: "rials", amount: 300, bankAccount: "5022291234567891", invoice: "/mock-invoices/3.jpg", status: "rejected", trackingCode: "12345612", daysAgo: 9, rejectionReason: "مبلغ با فیش مطابقت ندارد", reviewed: true },
  { userMobile: "905551234567", sourceSlug: "rials", targetSlug: "usd", amount: 20000000, bankAccount: "US1234567890123456", invoice: "/mock-invoices/1.jpg", status: "rejected", trackingCode: "12345613", daysAgo: 11, rejectionReason: "اطلاعات حساب نادرست", reviewed: true },
  { userMobile: "989121000004", sourceSlug: "lira", targetSlug: "rials", amount: 8000, bankAccount: "6104331234567892", invoice: "/mock-invoices/2.jpg", status: "rejected", trackingCode: "12345614", daysAgo: 14, rejectionReason: "تصویر فیش ناخوانا", reviewed: true },
  { userMobile: "989121000005", sourceSlug: "eur", targetSlug: "rials", amount: 150, bankAccount: "DE89370400440532013000", invoice: "/mock-invoices/3.jpg", status: "rejected", trackingCode: "12345615", daysAgo: 16, rejectionReason: "درخواست تکراری", reviewed: true },
];
