import { createBot } from "@/bot/app";
import { botConfig } from "@/bot/config";

export const runtime = "nodejs";

const bot = createBot();

export async function POST(request: Request) {
  if (botConfig.mode !== "webhook") {
    return new Response("Bot webhook disabled", { status: 404 });
  }

  const secret = botConfig.webhookSecret.trim();
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 503 });
  }

  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (headerSecret !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await request.json();
  await bot.handleUpdate(update);
  return new Response("OK");
}
