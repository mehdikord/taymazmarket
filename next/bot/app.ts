import { Bot, type Context, session, type SessionFlavor } from "grammy";
import { assertBotToken, botConfig } from "./config";
import { handleStart } from "./handlers/start";
import {
  handleAuthButton,
  handleAuthCode,
  handleAuthPhone,
  submitPhoneFromRaw,
} from "./handlers/auth";
import { handleMainMenuText } from "./handlers/menu";
import {
  handleInvalidInvoiceInput,
  handleNewRequestAmount,
  handleNewRequestBankText,
  handleNewRequestCallback,
  handleNewRequestInvoice,
  resumeNewRequestAfterBack,
} from "./handlers/new-request";
import { handleHistoryCallback } from "./handlers/history";
import { requireAuthenticated } from "./middleware/auth-guard";
import { handleBack, resetSession, resetToMainMenu } from "./navigation";
import { initialSession, type BotSession } from "./types/session";
import { t } from "./messages/fa";
import {
  authReplyKeyboard,
  mainMenuReplyKeyboard,
} from "./keyboards/reply";

export type BotContext = Context & SessionFlavor<BotSession>;

let botInstance: Bot<BotContext> | null = null;

export function createBot(): Bot<BotContext> {
  if (botInstance) {
    return botInstance;
  }

  assertBotToken();

  const bot = new Bot<BotContext>(botConfig.token);

  bot.use(
    session({
      initial: initialSession,
    }),
  );

  bot.catch(async (err) => {
    console.error("[bot] handler error", {
      chatId: err.ctx.chat?.id,
      error: err.error,
    });
    try {
      await err.ctx.reply(t.temporaryError);
    } catch {
      /* ignore */
    }
  });

  bot.command("start", handleStart);
  bot.command("cancel", async (ctx) => {
    resetSession(ctx);
    await ctx.reply(t.cancelled, {
      reply_markup: ctx.session.userId
        ? mainMenuReplyKeyboard()
        : authReplyKeyboard(),
    });
  });

  bot.hears(t.authButton, handleAuthButton);

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data === "nav:back") {
      const prev = handleBack(ctx);
      await ctx.answerCallbackQuery();
      if (prev.startsWith("NEW_REQUEST")) {
        await resumeNewRequestAfterBack(ctx, prev);
      } else if (prev === "MAIN_MENU") {
        resetToMainMenu(ctx);
        await ctx.reply(t.mainMenuHint, {
          reply_markup: mainMenuReplyKeyboard(),
        });
      } else if (prev === "IDLE") {
        await ctx.reply(t.welcome, { reply_markup: authReplyKeyboard() });
      } else if (prev === "AUTH_PHONE") {
        await ctx.reply(t.askPhone, { parse_mode: "Markdown" });
      }
      return;
    }

    if (
      await requireAuthenticated(ctx, async () => {
        if (await handleHistoryCallback(ctx, data)) return;
        if (
          data.startsWith("cur:") ||
          data.startsWith("bank:") ||
          data.startsWith("confirm:")
        ) {
          await handleNewRequestCallback(ctx, data);
        }
      })
    ) {
      return;
    }
    await ctx.answerCallbackQuery();
  });

  bot.on("message:contact", async (ctx) => {
    if (ctx.session.state !== "AUTH_PHONE") return;
    const phone = ctx.message.contact?.phone_number;
    if (!phone) return;
    await submitPhoneFromRaw(ctx, phone);
  });

  bot.on("message:text", async (ctx, next) => {
    const state = ctx.session.state;

    if (state === "AUTH_PHONE") {
      await handleAuthPhone(ctx);
      return;
    }
    if (state === "AUTH_CODE") {
      await handleAuthCode(ctx);
      return;
    }

    if (state === "MAIN_MENU") {
      await requireAuthenticated(ctx, async () => {
        await handleMainMenuText(ctx);
      });
      return;
    }

    if (state === "NEW_REQUEST_AMOUNT") {
      await requireAuthenticated(ctx, async () => {
        await handleNewRequestAmount(ctx);
      });
      return;
    }

    if (state === "NEW_REQUEST_BANK") {
      await requireAuthenticated(ctx, async () => {
        await handleNewRequestBankText(ctx);
      });
      return;
    }

    if (state === "IDLE") {
      if (ctx.message.text === t.authButton) {
        await handleAuthButton(ctx);
        return;
      }
      await ctx.reply(t.welcome, { reply_markup: authReplyKeyboard() });
      return;
    }

    await next();
  });

  bot.on("message", async (ctx) => {
    if (ctx.session.state !== "NEW_REQUEST_INVOICE") return;

    const hasPhoto = Boolean(ctx.message.photo?.length);
    const doc = ctx.message.document;
    const isImageDoc = Boolean(doc?.mime_type?.startsWith("image/"));

    await requireAuthenticated(ctx, async () => {
      if (hasPhoto || isImageDoc) {
        await handleNewRequestInvoice(ctx);
        return;
      }
      await handleInvalidInvoiceInput(ctx);
    });
  });

  botInstance = bot;
  return bot;
}
