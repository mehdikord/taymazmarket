/** PRD §۸.۲ + docs/bot-tasks/00-overview/state-machine.md */
export type ConversationState =
  | "IDLE"
  | "AUTH_PHONE"
  | "AUTH_CODE"
  | "MAIN_MENU"
  | "NEW_REQUEST_SOURCE"
  | "NEW_REQUEST_TARGET"
  | "NEW_REQUEST_AMOUNT"
  | "NEW_REQUEST_BANK"
  | "NEW_REQUEST_BANK_CONFIRM"
  | "NEW_REQUEST_INVOICE"
  | "HISTORY_LIST"
  | "HISTORY_DETAIL";

export type NewRequestDraft = {
  sourceCurrencyId?: number;
  targetCurrencyId?: number;
  amount?: string;
  bankAccount?: string;
  bankAccountPending?: string;
};

export type BotSession = {
  state: ConversationState;
  /** true فقط پس از تأیید کد در همین جلسه */
  isSessionVerified?: boolean;
  userId?: number;
  draft?: NewRequestDraft;
  historyPage?: number;
  historyDetailRequestId?: number;
  authAttempts?: number;
  authLockedUntil?: number;
};

export function initialSession(): BotSession {
  return {
    state: "IDLE",
    authAttempts: 0,
  };
}
