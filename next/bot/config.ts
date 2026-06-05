import path from "node:path";
import { config as loadEnv } from "dotenv";

const nextRoot = path.resolve(__dirname, "..");
loadEnv({ path: path.join(nextRoot, ".env") });
loadEnv({ path: path.join(nextRoot, ".env.local"), override: true });

export const botConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN ?? "",
  mode: (process.env.BOT_MODE ?? "polling") as "polling" | "webhook",
  webhookSecret: process.env.BOT_WEBHOOK_SECRET ?? "",
  webhookUrl: process.env.BOT_WEBHOOK_URL ?? "",
  uploadDir: process.env.UPLOAD_DIR ?? path.join(nextRoot, "uploads/invoices"),
} as const;

export function assertBotToken(): void {
  if (!botConfig.token.trim()) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing. Set it in next/.env or next/.env.local",
    );
  }
}
