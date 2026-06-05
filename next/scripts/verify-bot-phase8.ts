/**
 * فاز ۸ — notify service (DB؛ بدون ارسال واقعی تلگرام)
 */
import "dotenv/config";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { prisma } from "../lib/prisma";
import {
  notifyRequestApproved,
  notifyRequestRejected,
} from "../lib/services/telegram-notify";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const withChat = await prisma.exchangeRequest.findFirst({
    where: {
      user: { telegramChatId: { not: null }, deletedAt: null },
    },
    select: { id: true },
  });
  assert(withChat != null, "seed request with telegram_chat_id exists");

  const noChat = await prisma.exchangeRequest.findFirst({
    where: {
      user: { telegramChatId: null, deletedAt: null },
    },
    select: { id: true },
  });

  const id = Number(withChat.id);
  const approved = await notifyRequestApproved(id);
  assert(typeof approved === "boolean", "notifyRequestApproved returns boolean");

  if (noChat) {
    const skipped = await notifyRequestRejected(
      Number(noChat.id),
      "test reason",
    );
    assert(skipped === false, "notify skips when no chat_id");
  }

  console.info("verify-bot-phase8: all checks passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
