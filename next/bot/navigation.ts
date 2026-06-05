import type { BotContext } from "./app";
import type { ConversationState } from "./types/session";
import { initialSession } from "./types/session";
import { clearSessionAuth } from "./utils/auth-session";

const BACK_MAP: Partial<Record<ConversationState, ConversationState>> = {
  AUTH_PHONE: "IDLE",
  AUTH_CODE: "AUTH_PHONE",
  NEW_REQUEST_SOURCE: "MAIN_MENU",
  NEW_REQUEST_TARGET: "NEW_REQUEST_SOURCE",
  NEW_REQUEST_AMOUNT: "NEW_REQUEST_TARGET",
  NEW_REQUEST_BANK: "NEW_REQUEST_AMOUNT",
  NEW_REQUEST_BANK_CONFIRM: "NEW_REQUEST_BANK",
  NEW_REQUEST_INVOICE: "NEW_REQUEST_BANK",
  HISTORY_DETAIL: "HISTORY_LIST",
};

export function handleBack(ctx: BotContext): ConversationState {
  const prev = BACK_MAP[ctx.session.state];
  if (prev) {
    ctx.session.state = prev;
    return prev;
  }
  ctx.session.state = "MAIN_MENU";
  return "MAIN_MENU";
}

export function resetToMainMenu(ctx: BotContext): void {
  ctx.session.state = "MAIN_MENU";
  delete ctx.session.draft;
  delete ctx.session.historyPage;
  delete ctx.session.historyDetailRequestId;
}

export function resetSession(ctx: BotContext): void {
  const wasVerified = ctx.session.isSessionVerified === true;
  const userId = ctx.session.userId;
  const fresh = initialSession();
  ctx.session.state = fresh.state;
  ctx.session.authAttempts = fresh.authAttempts;
  delete ctx.session.draft;
  delete ctx.session.historyPage;
  delete ctx.session.historyDetailRequestId;
  if (wasVerified && userId != null) {
    ctx.session.isSessionVerified = true;
    ctx.session.userId = userId;
    ctx.session.state = "MAIN_MENU";
  } else {
    clearSessionAuth(ctx);
  }
}
