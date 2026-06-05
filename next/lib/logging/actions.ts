/**
 * فهرست actionهای `system_logs` — نام‌ها ثابت بمانند (فیلتر UI / seed).
 *
 * | Action            | entityType       | trigger              |
 * |-------------------|------------------|----------------------|
 * | admin.login       | Admin            | POST login           |
 * | admin.logout      | Admin            | POST logout          |
 * | admin.create      | Admin            | POST admins          |
 * | admin.update      | Admin            | PATCH admins         |
 * | admin.delete      | Admin            | DELETE admins        |
 * | user.create       | User             | POST users           |
 * | user.update       | User             | PATCH users          |
 * | user.delete       | User             | DELETE users         |
 * | currency.create   | Currency         | POST currencies      |
 * | currency.update   | Currency         | PATCH currencies     |
 * | currency.delete   | Currency         | DELETE currencies    |
 * | request.approve   | ExchangeRequest  | POST approve         |
 * | request.reject    | ExchangeRequest  | POST reject          |
 * | bot.start         | —                | ربات (آینده)         |
 * | bot.auth.success  | User             | ربات (آینده)         |
 * | bot.auth.fail     | —                | ربات (آینده)         |
 * | bot.request.create| ExchangeRequest  | ربات (آینده)         |
 */
export const LOG_ACTIONS = {
  adminLogin: "admin.login",
  adminLogout: "admin.logout",
  adminCreate: "admin.create",
  adminUpdate: "admin.update",
  adminDelete: "admin.delete",
  userCreate: "user.create",
  userUpdate: "user.update",
  userDelete: "user.delete",
  currencyCreate: "currency.create",
  currencyUpdate: "currency.update",
  currencyDelete: "currency.delete",
  requestApprove: "request.approve",
  requestReject: "request.reject",
  botStart: "bot.start",
  botAuthSuccess: "bot.auth.success",
  botAuthFail: "bot.auth.fail",
  botRequestCreate: "bot.request.create",
} as const;

export type LogAction = (typeof LOG_ACTIONS)[keyof typeof LOG_ACTIONS];

const PANEL_ACTION_SET = new Set<string>(Object.values(LOG_ACTIONS));

/** actionهایی که از پنل/API ادمین در فاز فعلی ثبت می‌شوند */
export const PANEL_LOG_ACTIONS: LogAction[] = [
  LOG_ACTIONS.adminLogin,
  LOG_ACTIONS.adminLogout,
  LOG_ACTIONS.adminCreate,
  LOG_ACTIONS.adminUpdate,
  LOG_ACTIONS.adminDelete,
  LOG_ACTIONS.userCreate,
  LOG_ACTIONS.userUpdate,
  LOG_ACTIONS.userDelete,
  LOG_ACTIONS.currencyCreate,
  LOG_ACTIONS.currencyUpdate,
  LOG_ACTIONS.currencyDelete,
  LOG_ACTIONS.requestApprove,
  LOG_ACTIONS.requestReject,
];

export function isKnownLogAction(action: string): action is LogAction {
  return PANEL_ACTION_SET.has(action);
}
