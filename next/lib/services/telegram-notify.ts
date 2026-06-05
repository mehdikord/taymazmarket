import { Bot } from "grammy";
import { botConfig, assertBotToken } from "@/bot/config";
import { t } from "@/bot/messages/fa";
import { prisma } from "@/lib/prisma";
let notifyBot: Bot | null = null;

function getNotifyBot(): Bot {
  if (!notifyBot) {
    assertBotToken();
    notifyBot = new Bot(botConfig.token);
  }
  return notifyBot;
}

async function getRequestNotifyContext(requestId: number) {
  const row = await prisma.exchangeRequest.findUnique({
    where: { id: BigInt(requestId) },
    include: {
      user: { select: { telegramChatId: true, deletedAt: true } },
    },
  });
  if (!row || row.user.deletedAt != null) return null;
  if (row.user.telegramChatId == null) return null;
  return {
    chatId: row.user.telegramChatId,
    trackingCode: row.trackingCode,
    status: row.status,
    rejectionReason: row.rejectionReason,
  };
}

export async function notifyRequestApproved(requestId: number): Promise<boolean> {
  const ctx = await getRequestNotifyContext(requestId);
  if (!ctx) {
    console.warn("[telegram-notify] skip approve — no chat_id", { requestId });
    return false;
  }

  try {
    await getNotifyBot().api.sendMessage(
      Number(ctx.chatId),
      t.requestApproved(ctx.trackingCode),
      { parse_mode: "Markdown" },
    );
    return true;
  } catch (err) {
    console.error("[telegram-notify] approve failed", { requestId, err });
    return false;
  }
}

export async function notifyRequestRejected(
  requestId: number,
  reason: string,
): Promise<boolean> {
  const ctx = await getRequestNotifyContext(requestId);
  if (!ctx) {
    console.warn("[telegram-notify] skip reject — no chat_id", { requestId });
    return false;
  }

  try {
    await getNotifyBot().api.sendMessage(
      Number(ctx.chatId),
      t.requestRejected(ctx.trackingCode, reason),
      { parse_mode: "Markdown" },
    );
    return true;
  } catch (err) {
    console.error("[telegram-notify] reject failed", { requestId, err });
    return false;
  }
}
