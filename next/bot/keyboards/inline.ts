import { InlineKeyboard } from "grammy";
import type { CurrencyListItem } from "@/lib/services/currencies";

export function backInlineKeyboard() {
  return new InlineKeyboard().text("◀️ بازگشت", "nav:back");
}

export function currencyInlineKeyboard(
  currencies: CurrencyListItem[],
  prefix: "src" | "tgt",
) {
  const kb = new InlineKeyboard();
  for (const c of currencies) {
    const label = `${c.title} – ${c.countryCode}`;
    kb.text(label, `cur:${prefix}:${c.id}`).row();
  }
  kb.text("◀️ بازگشت", "nav:back");
  return kb;
}

export function confirmBankKeyboard() {
  return new InlineKeyboard()
    .text("✅ بله", "confirm:yes")
    .text("❌ خیر", "confirm:no")
    .row()
    .text("◀️ بازگشت", "nav:back");
}

export function bankAccountPickKeyboard(
  accounts: { id: number; accountNumber: string; label: string | null }[],
) {
  const kb = new InlineKeyboard();
  for (const a of accounts) {
    const label = a.label ? `${a.label} — ${a.accountNumber}` : a.accountNumber;
    kb.text(label, `bank:pick:${a.id}`).row();
  }
  kb.text("➕ شماره جدید", "bank:new").row();
  kb.text("◀️ بازگشت", "nav:back");
  return kb;
}

export function historyListKeyboard(
  items: { id: number; label: string }[],
  page: number,
  hasMore: boolean,
) {
  const kb = new InlineKeyboard();
  for (const item of items) {
    kb.text(item.label, `hist:item:${item.id}`).row();
  }
  if (hasMore) {
    kb.text("▶️ بیشتر", `hist:page:${page + 1}`).row();
  }
  kb.text("◀️ بازگشت به منو", "nav:menu");
  return kb;
}

export function historyDetailKeyboard() {
  return new InlineKeyboard().text("◀️ بازگشت", "nav:hist:back");
}
