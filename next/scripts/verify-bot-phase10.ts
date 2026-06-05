/**
 * فاز ۱۰ — rate limit auth + امنیت metadata
 */
import "dotenv/config";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { prisma } from "../lib/prisma";
import {
  MAX_AUTH_ATTEMPTS,
  submitVerificationCode,
} from "../lib/services/bot-auth";
import { sanitizeLogMetadata } from "../lib/logging/sanitize-metadata";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      mobile: "989121000001",
      deletedAt: null,
      verificationCode: { not: null },
    },
    select: { telegramChatId: true },
  });
  assert(user?.telegramChatId != null, "seed user with chat id");

  const locked = await submitVerificationCode(
    user.telegramChatId!,
    "WRONG",
    MAX_AUTH_ATTEMPTS,
  );
  assert(locked.type === "locked", "locked after max attempts");

  const meta = sanitizeLogMetadata({
    verification_code: "SECRET",
    reason: "wrong_code",
  });
  assert(meta?.verification_code === undefined, "verification_code stripped");
  assert(meta?.reason === "wrong_code", "safe metadata kept");

  console.info("verify-bot-phase10: all checks passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
