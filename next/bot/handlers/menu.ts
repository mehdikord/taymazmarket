import type { BotContext } from "../app";
import { t } from "../messages/fa";
import { mainMenuReplyKeyboard } from "../keyboards/reply";
import { resetToMainMenu } from "../navigation";
import { startNewRequest } from "./new-request";
import { startHistory } from "./history";

export async function handleMainMenuText(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  if (text === t.menuNewRequest) {
    await startNewRequest(ctx);
    return;
  }

  if (text === t.menuHistory) {
    await startHistory(ctx);
    return;
  }

  if (text === t.cancel) {
    resetToMainMenu(ctx);
    await ctx.reply(t.cancelled, { reply_markup: mainMenuReplyKeyboard() });
    return;
  }

  await ctx.reply(t.unknownMessage);
}
