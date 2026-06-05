import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { BotContext } from "@/bot/app";
import { botConfig } from "@/bot/config";

/**
 * دانلود فاکتور از تلگرام و ذخیره محلی — فاز ۹ (MVP: مسیر API)
 */
export async function saveInvoiceFromTelegram(
  ctx: BotContext,
  fileId: string,
  userId: number,
): Promise<string> {
  const file = await ctx.api.getFile(fileId);
  if (!file.file_path) {
    throw new Error("telegram_file_path_missing");
  }

  const url = `https://api.telegram.org/file/bot${botConfig.token}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`telegram_download_failed:${res.status}`);
  }

  const ext = path.extname(file.file_path) || ".jpg";
  const dir = path.join(botConfig.uploadDir, String(userId));
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const fullPath = path.join(dir, filename);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(fullPath, buffer);

  return `/api/invoices/${userId}/${filename}`;
}
