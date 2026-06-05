import { mapUser } from "@/lib/db/mappers";
import { notDeleted } from "@/lib/db/soft-delete";
import { telegramChatIdFromString, toEntityId } from "@/lib/db/serialize";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/types";
import { normalizeMobile } from "@/lib/utils/mobile";

export type TelegramProfileInput = {
  chatId: string | number | bigint;
  username?: string | null;
  name?: string | null;
};

export type AuthPhoneResult =
  | { type: "invalid_phone" }
  | { type: "created_inactive"; user: User }
  | { type: "need_code"; user: User }
  | { type: "already_authenticated"; user: User };

export type AuthCodeResult =
  | { type: "no_user" }
  | { type: "inactive" }
  | { type: "locked"; retryAfterSec: number }
  | { type: "wrong_code"; attemptsLeft: number }
  | { type: "success"; user: User };

export const MAX_AUTH_ATTEMPTS = 5;
export const AUTH_LOCK_SECONDS = 15 * 60;

function chatIdToBigInt(chatId: string | number | bigint): bigint {
  if (typeof chatId === "bigint") return chatId;
  return BigInt(chatId);
}

function buildTelegramName(name?: string | null): string | null {
  const trimmed = name?.trim();
  return trimmed || null;
}

function sanitizeUsername(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace(/^@/, "");
}

function telegramProfileFields(profile: TelegramProfileInput) {
  return {
    telegramChatId: chatIdToBigInt(profile.chatId),
    telegramUsername: sanitizeUsername(profile.username),
    name: buildTelegramName(profile.name),
  };
}

export function isUserAuthenticated(user: User): boolean {
  return Boolean(user.verificationCode?.trim());
}

export async function findUserByTelegramChatId(
  chatId: string | number | bigint,
): Promise<User | null> {
  const row = await prisma.user.findFirst({
    where: {
      telegramChatId: chatIdToBigInt(chatId),
      ...notDeleted,
    },
  });
  return row ? mapUser(row) : null;
}

export async function submitPhoneForAuth(
  profile: TelegramProfileInput,
  phoneRaw: string,
): Promise<AuthPhoneResult> {
  const mobile = normalizeMobile(phoneRaw);
  if (!mobile) {
    return { type: "invalid_phone" };
  }

  const telegramFields = telegramProfileFields(profile);

  const existing = await prisma.user.findFirst({
    where: { mobile, ...notDeleted },
  });

  if (existing) {
    const row = await prisma.user.update({
      where: { id: existing.id },
      data: telegramFields,
    });
    const user = mapUser(row);

    if (isUserAuthenticated(user)) {
      return { type: "need_code", user };
    }
    return { type: "created_inactive", user };
  }

  const row = await prisma.user.create({
    data: {
      mobile,
      ...telegramFields,
      verificationCode: null,
      notes: null,
      profileImageUrl: null,
    },
  });

  const user = mapUser(row);
  return { type: "created_inactive", user };
}

export async function submitVerificationCode(
  chatId: string | number | bigint,
  codeRaw: string,
  currentAttempts = 0,
): Promise<AuthCodeResult> {
  if (currentAttempts >= MAX_AUTH_ATTEMPTS) {
    return { type: "locked", retryAfterSec: AUTH_LOCK_SECONDS };
  }

  const user = await findUserByTelegramChatId(chatId);
  if (!user) {
    return { type: "no_user" };
  }

  if (!isUserAuthenticated(user)) {
    return { type: "inactive" };
  }

  const code = codeRaw.trim();
  if (!code) {
    const attemptsLeft = Math.max(0, MAX_AUTH_ATTEMPTS - currentAttempts - 1);
    await appendLog({
      actorType: "user",
      actorId: user.id,
      action: LOG_ACTIONS.botAuthFail,
      entityType: "User",
      entityId: user.id,
      metadata: { reason: "empty_code" },
    });
    return { type: "wrong_code", attemptsLeft };
  }

  if (user.verificationCode !== code) {
    const attemptsLeft = Math.max(0, MAX_AUTH_ATTEMPTS - currentAttempts - 1);
    await appendLog({
      actorType: "user",
      actorId: user.id,
      action: LOG_ACTIONS.botAuthFail,
      entityType: "User",
      entityId: user.id,
      metadata: { reason: "wrong_code" },
    });
    return { type: "wrong_code", attemptsLeft };
  }

  await appendLog({
    actorType: "user",
    actorId: user.id,
    action: LOG_ACTIONS.botAuthSuccess,
    entityType: "User",
    entityId: user.id,
    metadata: { userId: user.id },
  });

  return { type: "success", user };
}

/** لاگ استارت — جدا از فلو موبایل */
export async function logBotStart(chatId: string | number | bigint): Promise<void> {
  const user = await findUserByTelegramChatId(chatId);
  await appendLog({
    actorType: "user",
    actorId: user?.id ?? null,
    action: LOG_ACTIONS.botStart,
    entityType: user ? "User" : "System",
    entityId: user?.id ?? null,
    metadata: {
      telegramChatId: chatIdToBigInt(chatId).toString(),
    },
  });
}

export async function refreshUserTelegramProfile(
  userId: number,
  profile: TelegramProfileInput,
): Promise<User> {
  const row = await prisma.user.update({
    where: { id: BigInt(userId) },
    data: telegramProfileFields(profile),
  });
  return mapUser(row);
}

export { chatIdToBigInt, toEntityId };
