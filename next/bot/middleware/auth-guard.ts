import {
  findUserByTelegramChatId,
  isUserAuthenticated,
} from "@/lib/services/bot-auth";
import type { BotContext } from "../app";
import { t } from "../messages/fa";
import { authReplyKeyboard } from "../keyboards/reply";
import { clearSessionAuth, isSessionVerified } from "../utils/auth-session";

/** @returns true اگر احراز شده و fn اجرا شد */
export async function requireAuthenticated(
  ctx: BotContext,
  fn: () => Promise<void>,
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (chatId == null) return false;

  if (!isSessionVerified(ctx)) {
    ctx.session.state = "IDLE";
    await ctx.reply(t.needAuth, { reply_markup: authReplyKeyboard() });
    return false;
  }

  const user = await findUserByTelegramChatId(chatId);
  if (!user) {
    clearSessionAuth(ctx);
    ctx.session.state = "IDLE";
    await ctx.reply(t.needAuth, { reply_markup: authReplyKeyboard() });
    return false;
  }

  if (!isUserAuthenticated(user)) {
    clearSessionAuth(ctx);
    ctx.session.state = "IDLE";
    await ctx.reply(t.accountDeactivated, { reply_markup: authReplyKeyboard() });
    return false;
  }

  if (ctx.session.userId !== user.id) {
    clearSessionAuth(ctx);
    ctx.session.state = "IDLE";
    await ctx.reply(t.needAuth, { reply_markup: authReplyKeyboard() });
    return false;
  }

  await fn();
  return true;
}
