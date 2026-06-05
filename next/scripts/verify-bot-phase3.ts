/**
 * فاز ۳–۵ — compile و import گره‌های ربات
 */
import { createBot } from "../bot/app";
import { initialSession } from "../bot/types/session";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const bot = createBot();
assert(bot != null, "createBot returns instance");

const session = initialSession();
assert(session.state === "IDLE", "initial session IDLE");

console.info("verify-bot-phase3: all checks passed");
