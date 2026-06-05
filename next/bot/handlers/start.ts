import {
  findUserByTelegramChatId,
  isUserAuthenticated,
  logBotStart,
  refreshUserTelegramProfile,
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
  isSessionVerified,
} from "../utils/auth-session";

export async function handleStart(ctx: BotContext): Promise<void> {
  const chatId = ctx.chat!.id;
  await logBotStart(chatId);

  let user = await findUserByTelegramChatId(chatId);
  const profile = buildDisplayName(ctx);

  if (user) {
    user = await refreshUserTelegramProfile(user.id, {
      chatId,
      ...profile,
    });
  }

  if (
    user &&
    isUserAuthenticated(user) &&
    isSessionVerified(ctx) &&
    ctx.session.userId === user.id
  ) {
    ctx.session.state = "MAIN_MENU";
    ctx.session.authAttempts = 0;
    await ctx.reply(t.welcome, { reply_markup: mainMenuReplyKeyboard() });
    await ctx.reply(t.mainMenuHint);
    return;
  }

  clearSessionAuth(ctx);
  ctx.session.state = "IDLE";
  await ctx.reply(t.welcome, { reply_markup: authReplyKeyboard() });
}
