import { Prisma } from "@/lib/generated/prisma/client";
import type { EntityId } from "@/lib/types";

type DecimalValue = Prisma.Decimal;

/** bigint PK/FK → number for API (autoincrement IDs stay within safe integer range) */
export function toEntityId(id: bigint): EntityId {
  const n = Number(id);
  if (!Number.isSafeInteger(n)) {
    throw new Error(`Entity id out of safe integer range: ${id}`);
  }
  return n;
}

export function toBigIntId(id: EntityId): bigint {
  return BigInt(id);
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}

export function telegramChatIdToString(
  chatId: bigint | null | undefined,
): string | null {
  if (chatId == null) return null;
  return chatId.toString();
}

export function telegramChatIdFromString(
  chatId: string | null | undefined,
): bigint | null {
  if (chatId == null || chatId.trim() === "") return null;
  return BigInt(chatId.trim());
}

export function decimalToNumber(
  value: DecimalValue | number | string | null | undefined,
): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export function decimalFromNumber(value: number): DecimalValue {
  return new Prisma.Decimal(value);
}

/** Prisma Json → plain object for API */
export function jsonToMetadata(
  value: unknown,
): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}
