import type { BotContext } from "../app";

/** احراز واقعی فقط پس از ورود کد در همین جلسه ربات (PRD §۶.۲) */
export function isSessionVerified(ctx: BotContext): boolean {
  return ctx.session.isSessionVerified === true;
}

export function setSessionVerified(ctx: BotContext, userId: number): void {
  ctx.session.isSessionVerified = true;
  ctx.session.userId = userId;
}

export function clearSessionAuth(ctx: BotContext): void {
  ctx.session.isSessionVerified = false;
  delete ctx.session.userId;
}
