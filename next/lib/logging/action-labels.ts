import { LOG_ACTIONS } from "./actions";

const LABELS: Record<string, string> = {
  [LOG_ACTIONS.adminLogin]: "ورود مدیر",
  [LOG_ACTIONS.adminLogout]: "خروج مدیر",
  [LOG_ACTIONS.adminCreate]: "ایجاد مدیر",
  [LOG_ACTIONS.adminUpdate]: "ویرایش مدیر",
  [LOG_ACTIONS.adminDelete]: "حذف مدیر",
  [LOG_ACTIONS.userCreate]: "ایجاد کاربر",
  [LOG_ACTIONS.userUpdate]: "ویرایش کاربر",
  [LOG_ACTIONS.userDelete]: "حذف کاربر",
  [LOG_ACTIONS.currencyCreate]: "ایجاد ارز",
  [LOG_ACTIONS.currencyUpdate]: "ویرایش ارز",
  [LOG_ACTIONS.currencyDelete]: "حذف ارز",
  [LOG_ACTIONS.requestApprove]: "تایید درخواست",
  [LOG_ACTIONS.requestReject]: "رد درخواست",
  [LOG_ACTIONS.botStart]: "استارت ربات",
  [LOG_ACTIONS.botAuthSuccess]: "احراز هویت موفق",
  [LOG_ACTIONS.botAuthFail]: "احراز هویت ناموفق",
  [LOG_ACTIONS.botRequestCreate]: "ثبت درخواست از ربات",
};

export function getActionLabelFa(action: string): string {
  return LABELS[action] ?? action;
}
