/**
 * ثبت webhook تلگرام — فاز ۱۱
 * نیاز: BOT_WEBHOOK_URL, BOT_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN
 */
import "../bot/config";
import { botConfig, assertBotToken } from "../bot/config";

assertBotToken();

async function main(): Promise<void> {
  const url = botConfig.webhookUrl.trim();
  const secret = botConfig.webhookSecret.trim();

  if (!url || !secret) {
    console.error("Set BOT_WEBHOOK_URL and BOT_WEBHOOK_SECRET");
    process.exit(1);
  }

  const apiUrl = `https://api.telegram.org/bot${botConfig.token}/setWebhook`;
  const body = new URLSearchParams({
    url,
    secret_token: secret,
    drop_pending_updates: "true",
  });

  const res = await fetch(apiUrl, { method: "POST", body });
  const json = (await res.json()) as { ok: boolean; description?: string };

  if (!json.ok) {
    console.error("setWebhook failed:", json.description ?? res.status);
    process.exit(1);
  }

  console.info("Webhook set:", url);
}

main();
