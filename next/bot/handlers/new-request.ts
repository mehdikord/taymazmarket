import { listCurrencies } from "@/lib/services/currencies";
import { createRequestFromBot } from "@/lib/services/bot-requests";
import {
  listBankAccountsForUser,
  normalizeAccountNumber,
  saveBankAccountIfNew,
} from "@/lib/services/user-bank-accounts";
import type { BotContext } from "../app";
import { t } from "../messages/fa";
import {
  bankAccountPickKeyboard,
  confirmBankKeyboard,
  currencyInlineKeyboard,
} from "../keyboards/inline";
import { mainMenuReplyKeyboard } from "../keyboards/reply";
import { handleBack, resetToMainMenu } from "../navigation";
import { toEnglishDigits } from "@/lib/utils/persian-digits";

export async function startNewRequest(ctx: BotContext): Promise<void> {
  ctx.session.draft = {};
  ctx.session.state = "NEW_REQUEST_SOURCE";
  const currencies = await listCurrencies(true);
  await ctx.reply("💱 ارز **مبدا** را انتخاب کنید:", {
    parse_mode: "Markdown",
    reply_markup: currencyInlineKeyboard(currencies, "src"),
  });
}

export async function handleNewRequestCallback(
  ctx: BotContext,
  data: string,
): Promise<boolean> {
  if (data.startsWith("cur:src:")) {
    const id = Number(data.split(":")[2]);
    ctx.session.draft = { ...ctx.session.draft, sourceCurrencyId: id };
    ctx.session.state = "NEW_REQUEST_TARGET";
    const currencies = await listCurrencies(true);
    const filtered = currencies.filter((c) => c.id !== id);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("💱 ارز **مقصد** را انتخاب کنید:", {
      parse_mode: "Markdown",
      reply_markup: currencyInlineKeyboard(filtered, "tgt"),
    });
    return true;
  }

  if (data.startsWith("cur:tgt:")) {
    const id = Number(data.split(":")[2]);
    ctx.session.draft = { ...ctx.session.draft, targetCurrencyId: id };
    ctx.session.state = "NEW_REQUEST_AMOUNT";
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "💰 مبلغ تبدیل را به صورت **عدد** ارسال کنید:",
      { parse_mode: "Markdown" },
    );
    return true;
  }

  if (data === "bank:new") {
    ctx.session.state = "NEW_REQUEST_BANK";
    await ctx.answerCallbackQuery();
    await ctx.reply("🏦 شماره کارت / حساب / شبا را ارسال کنید:");
    return true;
  }

  if (data.startsWith("bank:pick:")) {
    const accountId = Number(data.split(":")[2]);
    const userId = ctx.session.userId!;
    const targetId = ctx.session.draft?.targetCurrencyId!;
    const accounts = await listBankAccountsForUser(userId, targetId);
    const picked = accounts.find((a) => a.id === accountId);
    if (!picked) {
      await ctx.answerCallbackQuery({ text: "حساب یافت نشد" });
      return true;
    }
    ctx.session.draft = {
      ...ctx.session.draft,
      bankAccount: picked.accountNumber,
    };
    ctx.session.state = "NEW_REQUEST_INVOICE";
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "📎 لطفاً **تصویر فاکتور** (فیش واریز) را ارسال کنید:",
      { parse_mode: "Markdown" },
    );
    return true;
  }

  if (data === "confirm:yes") {
    const pending = ctx.session.draft?.bankAccountPending;
    const userId = ctx.session.userId!;
    const targetId = ctx.session.draft?.targetCurrencyId!;
    if (!pending || !userId || !targetId) {
      await ctx.answerCallbackQuery();
      return true;
    }
    await saveBankAccountIfNew(userId, targetId, pending);
    ctx.session.draft = {
      ...ctx.session.draft,
      bankAccount: normalizeAccountNumber(pending),
    };
    delete ctx.session.draft.bankAccountPending;
    ctx.session.state = "NEW_REQUEST_INVOICE";
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "📎 لطفاً **تصویر فاکتور** (فیش واریز) را ارسال کنید:",
      { parse_mode: "Markdown" },
    );
    return true;
  }

  if (data === "confirm:no") {
    ctx.session.state = "NEW_REQUEST_BANK";
    delete ctx.session.draft?.bankAccountPending;
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🏦 شماره را مجدداً ارسال کنید:");
    return true;
  }

  return false;
}

export async function handleNewRequestAmount(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  const normalized = toEnglishDigits(text).replace(/,/g, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    await ctx.reply("⚠️ مقدار را به صورت عدد مثبت وارد کنید.");
    return;
  }

  ctx.session.draft = { ...ctx.session.draft, amount: String(amount) };
  const userId = ctx.session.userId!;
  const targetId = ctx.session.draft.targetCurrencyId!;

  const accounts = await listBankAccountsForUser(userId, targetId);
  ctx.session.state = "NEW_REQUEST_BANK";

  if (accounts.length > 0) {
    await ctx.reply("🏦 حساب بانکی را انتخاب کنید یا شماره جدید وارد کنید:", {
      reply_markup: bankAccountPickKeyboard(accounts),
    });
    return;
  }

  await ctx.reply("🏦 شماره کارت / حساب / شبا را ارسال کنید:");
}

export async function handleNewRequestBankText(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  const pending = normalizeAccountNumber(text);
  if (!pending) {
    await ctx.reply("⚠️ شماره حساب نامعتبر است.");
    return;
  }

  ctx.session.draft = { ...ctx.session.draft, bankAccountPending: pending };
  ctx.session.state = "NEW_REQUEST_BANK_CONFIRM";
  await ctx.reply(`آیا شماره \`${pending}\` قابل تأیید است؟`, {
    parse_mode: "Markdown",
    reply_markup: confirmBankKeyboard(),
  });
}

/** در state فاکتور — ورودی غیرتصویر؛ state عوض نمی‌شود */
export async function handleInvalidInvoiceInput(
  ctx: BotContext,
): Promise<void> {
  await ctx.reply(t.invalidInvoiceInput);
}

export async function handleNewRequestInvoice(ctx: BotContext): Promise<void> {
  const photo = ctx.message?.photo;
  const doc = ctx.message?.document;

  let fileId: string | undefined;
  if (photo?.length) {
    fileId = photo[photo.length - 1]!.file_id;
  } else if (doc?.mime_type?.startsWith("image/")) {
    fileId = doc.file_id;
  }

  if (!fileId) {
    await handleInvalidInvoiceInput(ctx);
    return;
  }

  const draft = ctx.session.draft;
  const userId = ctx.session.userId;
  if (
    !draft?.sourceCurrencyId ||
    !draft.targetCurrencyId ||
    !draft.amount ||
    !draft.bankAccount ||
    !userId
  ) {
    await ctx.reply(t.temporaryError);
    return;
  }

  const { saveInvoiceFromTelegram } = await import("@/lib/bot/save-invoice");
  const invoiceImageUrl = await saveInvoiceFromTelegram(ctx, fileId, userId);

  const request = await createRequestFromBot({
    userId,
    sourceCurrencyId: draft.sourceCurrencyId,
    targetCurrencyId: draft.targetCurrencyId,
    amount: Number(draft.amount),
    bankAccount: draft.bankAccount,
    invoiceImageUrl,
  });

  resetToMainMenu(ctx);
  await ctx.reply(
    `🎉 درخواست شما با شماره پیگیری \`${request.trackingCode}\` ثبت شد و در انتظار تأیید مدیریت است.\n\nپاسخ از همین ربات ارسال می‌شود.`,
    {
      parse_mode: "Markdown",
      reply_markup: mainMenuReplyKeyboard(),
    },
  );
}

export async function resumeNewRequestAfterBack(
  ctx: BotContext,
  state: string,
): Promise<void> {
  if (state === "MAIN_MENU") {
    return;
  }
  if (state === "NEW_REQUEST_SOURCE") {
    await startNewRequest(ctx);
  } else if (state === "NEW_REQUEST_TARGET") {
    const currencies = await listCurrencies(true);
    const src = ctx.session.draft?.sourceCurrencyId;
    const filtered = currencies.filter((c) => c.id !== src);
    await ctx.reply("💱 ارز **مقصد** را انتخاب کنید:", {
      parse_mode: "Markdown",
      reply_markup: currencyInlineKeyboard(filtered, "tgt"),
    });
  } else if (state === "NEW_REQUEST_AMOUNT") {
    await ctx.reply("💰 مبلغ تبدیل را به صورت **عدد** ارسال کنید:", {
      parse_mode: "Markdown",
    });
  } else if (state === "NEW_REQUEST_BANK") {
    const userId = ctx.session.userId!;
    const targetId = ctx.session.draft?.targetCurrencyId!;
    const accounts = await listBankAccountsForUser(userId, targetId);
    if (accounts.length > 0) {
      await ctx.reply("🏦 حساب بانکی را انتخاب کنید:", {
        reply_markup: bankAccountPickKeyboard(accounts),
      });
    } else {
      await ctx.reply("🏦 شماره حساب را ارسال کنید:");
    }
  }
}
