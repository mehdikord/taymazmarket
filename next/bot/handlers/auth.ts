import {
  submitPhoneForAuth,
  submitVerificationCode,
} from "@/lib/services/bot-auth";
import type { BotContext } from "../app";
import { t } from "../messages/fa";
import {
  authReplyKeyboard,
  mainMenuReplyKeyboard,
} from "../keyboards/reply";
import { buildDisplayName } from "../utils/profile";
import {
  clearSessionAuth,
  setSessionVerified,
} from "../utils/auth-session";

export async function handleAuthButton(ctx: BotContext): Promise<void> {
  const lockedUntil = ctx.session.authLockedUntil;
  if (lockedUntil != null && Date.now() < lockedUntil) {
    await ctx.reply(t.authLocked);
    return;
  }

  clearSessionAuth(ctx);
  ctx.session.state = "AUTH_PHONE";
  ctx.session.authAttempts = 0;
  delete ctx.session.authLockedUntil;
  await ctx.reply(t.askPhone, {
    parse_mode: "Markdown",
    reply_markup: { remove_keyboard: true },
  });
}

export async function submitPhoneFromRaw(
  ctx: BotContext,
  phoneRaw: string,
): Promise<void> {
  const profile = buildDisplayName(ctx);
  const result = await submitPhoneForAuth(
    { chatId: ctx.chat!.id, ...profile },
    phoneRaw,
  );

  if (result.type === "invalid_phone") {
    await ctx.reply(t.invalidPhone, { parse_mode: "Markdown" });
    return;
  }

  if (result.type === "created_inactive") {
    clearSessionAuth(ctx);
    ctx.session.state = "IDLE";
    await ctx.reply(t.accountCreated, { reply_markup: authReplyKeyboard() });
    return;
  }

  clearSessionAuth(ctx);
  ctx.session.state = "AUTH_CODE";
  ctx.session.authAttempts = 0;
  await ctx.reply(t.askCode);
}

export async function handleAuthPhone(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text) return;
  await submitPhoneFromRaw(ctx, text);
}

export async function handleAuthCode(ctx: BotContext): Promise<void> {
  const lockedUntil = ctx.session.authLockedUntil;
  if (lockedUntil != null && Date.now() < lockedUntil) {
    await ctx.reply(t.authLocked);
    return;
  }

  const text = ctx.message?.text?.trim();
  if (!text) return;

  const attempts = ctx.session.authAttempts ?? 0;
  const result = await submitVerificationCode(ctx.chat!.id, text, attempts);

  if (result.type === "locked") {
    clearSessionAuth(ctx);
    ctx.session.authLockedUntil = Date.now() + result.retryAfterSec * 1000;
    ctx.session.state = "IDLE";
    await ctx.reply(t.authLocked, { reply_markup: authReplyKeyboard() });
    return;
  }

  if (result.type === "wrong_code") {
    ctx.session.authAttempts = attempts + 1;
    if (result.attemptsLeft <= 0) {
      clearSessionAuth(ctx);
      ctx.session.authLockedUntil = Date.now() + 15 * 60 * 1000;
      ctx.session.state = "IDLE";
      await ctx.reply(t.authLocked, { reply_markup: authReplyKeyboard() });
    } else if (result.attemptsLeft <= 2) {
      await ctx.reply(t.wrongCodeWithAttempts(result.attemptsLeft));
    } else {
      await ctx.reply(t.wrongCode);
    }
    return;
  }

  if (result.type === "inactive") {
    clearSessionAuth(ctx);
    ctx.session.state = "IDLE";
    await ctx.reply(t.accountDeactivated, { reply_markup: authReplyKeyboard() });
    return;
  }

  if (result.type === "no_user") {
    clearSessionAuth(ctx);
    ctx.session.state = "IDLE";
    await ctx.reply(t.needAuth, { reply_markup: authReplyKeyboard() });
    return;
  }

  setSessionVerified(ctx, result.user.id);
  ctx.session.state = "MAIN_MENU";
  ctx.session.authAttempts = 0;
  delete ctx.session.authLockedUntil;
  await ctx.reply(t.authSuccess, { reply_markup: mainMenuReplyKeyboard() });
  await ctx.reply(t.mainMenuHint);
}
