import { createdAtWhere } from "@/lib/db/dates";
import { notDeleted } from "@/lib/db/soft-delete";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { normalizeMobile } from "@/lib/utils/mobile";
import type { ListUsersQuery } from "./types";

async function userIdsMatchingChatId(chatId: string): Promise<bigint[]> {
  const pattern = `%${chatId.trim()}%`;
  const rows = await prisma.$queryRaw<{ id: bigint }[]>`
    SELECT id FROM users
    WHERE deleted_at IS NULL
      AND telegram_chat_id IS NOT NULL
      AND CAST(telegram_chat_id AS CHAR) LIKE ${pattern}
  `;
  return rows.map((r) => r.id);
}

export async function buildUsersWhere(
  query: ListUsersQuery,
): Promise<Prisma.UserWhereInput> {
  const tab = query.tab ?? "all";
  const where: Prisma.UserWhereInput = { ...notDeleted };

  if (tab === "active") {
    where.verificationCode = { not: null };
  } else if (tab === "inactive") {
    where.verificationCode = null;
  }

  if (query.hasCode === "true") {
    where.verificationCode = { not: null };
  } else if (query.hasCode === "false") {
    where.verificationCode = null;
  }

  const q = query.q?.trim().toLowerCase();
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { mobile: { contains: q.replace(/\s/g, "") } },
      { telegramUsername: { contains: q } },
    ];
  }

  if (query.mobile?.trim()) {
    const m = normalizeMobile(query.mobile) ?? query.mobile.trim();
    where.mobile = { contains: m };
  }

  if (query.name?.trim()) {
    where.name = { contains: query.name.trim() };
  }

  Object.assign(where, createdAtWhere(query.createdFrom, query.createdTo));

  if (query.chatId?.trim()) {
    const ids = await userIdsMatchingChatId(query.chatId);
    where.id = ids.length > 0 ? { in: ids } : { in: [BigInt(0)] };
  }

  return where;
}
