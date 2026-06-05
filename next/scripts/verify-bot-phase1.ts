/**
 * فاز ۱ — بررسی توکن و اتصال Telegram API (بدون polling طولانی)
 */
import "../bot/config";
import { Bot } from "grammy";
import { assertBotToken, botConfig } from "../bot/config";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  assertBotToken();
  assert(botConfig.token.length > 10, "TELEGRAM_BOT_TOKEN looks too short");

  const bot = new Bot(botConfig.token);
  const me = await bot.api.getMe();

  assert(Boolean(me.username), "getMe returned bot username");
  console.info(`OK: connected as @${me.username} (id=${me.id})`);
  console.info(`OK: BOT_MODE=${botConfig.mode}`);
  console.info("verify-bot-phase1: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
