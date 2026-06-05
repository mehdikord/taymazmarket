import {
  getUserRequestDetail,
  listUserRequests,
} from "@/lib/services/bot-requests";
import type { BotContext } from "../app";
import { formatHistoryDetail } from "../messages/fa";
import { historyDetailKeyboard, historyListKeyboard } from "../keyboards/inline";
import { mainMenuReplyKeyboard } from "../keyboards/reply";
import { resetToMainMenu } from "../navigation";

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US");
}

export async function startHistory(ctx: BotContext): Promise<void> {
  await showHistoryPage(ctx, 1);
}

export async function showHistoryPage(
  ctx: BotContext,
  page: number,
): Promise<void> {
  const userId = ctx.session.userId!;
  const { items, hasMore } = await listUserRequests(userId, { page });

  ctx.session.state = "HISTORY_LIST";
  ctx.session.historyPage = page;

  if (items.length === 0) {
    await ctx.reply("📭 هنوز درخواستی ثبت نکرده‌اید.", {
      reply_markup: mainMenuReplyKeyboard(),
    });
    ctx.session.state = "MAIN_MENU";
    return;
  }

  const keyboardItems = items.map((item) => ({
    id: item.id,
    label: `${item.sourceTitle} → ${item.targetTitle} – ${formatAmount(item.amount)}`,
  }));

  const text =
    page === 1
      ? "📋 تاریخچه درخواست‌های شما:"
      : `📋 تاریخچه — صفحه ${page}:`;

  const markup = historyListKeyboard(keyboardItems, page, hasMore);

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, { reply_markup: markup });
  } else {
    await ctx.reply(text, { reply_markup: markup });
  }
}

export async function showHistoryDetail(
  ctx: BotContext,
  requestId: number,
): Promise<void> {
  const userId = ctx.session.userId!;
  const detail = await getUserRequestDetail(userId, requestId);
  if (!detail) {
    await ctx.answerCallbackQuery({ text: "درخواست یافت نشد" });
    return;
  }

  ctx.session.state = "HISTORY_DETAIL";
  ctx.session.historyDetailRequestId = requestId;

  const text = formatHistoryDetail(detail);

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    reply_markup: historyDetailKeyboard(),
  });
}

export async function handleHistoryCallback(
  ctx: BotContext,
  data: string,
): Promise<boolean> {
  if (data.startsWith("hist:page:")) {
    const page = Number(data.split(":")[2]);
    await showHistoryPage(ctx, page);
    return true;
  }

  if (data.startsWith("hist:item:")) {
    const id = Number(data.split(":")[2]);
    await showHistoryDetail(ctx, id);
    return true;
  }

  if (data === "nav:hist:back") {
    const page = ctx.session.historyPage ?? 1;
    await showHistoryPage(ctx, page);
    return true;
  }

  if (data === "nav:menu") {
    resetToMainMenu(ctx);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("بازگشت به منو.", {
      reply_markup: undefined,
    });
    await ctx.reply("از منوی زیر انتخاب کنید:", {
      reply_markup: mainMenuReplyKeyboard(),
    });
    return true;
  }

  return false;
}
