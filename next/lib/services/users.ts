import { mapUser } from "@/lib/db/mappers";
import { notDeleted, softDeleteUser } from "@/lib/db/soft-delete";
import { telegramChatIdFromString, toBigIntId } from "@/lib/db/serialize";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { prisma } from "@/lib/prisma";
import type { EntityId, User } from "@/lib/types";
import { getUserStatus } from "@/lib/types";
import type { CreateUserDto, UpdateUserDto } from "@/lib/types/dto";
import { normalizeMobile } from "@/lib/utils/mobile";
import type { Prisma } from "@/lib/generated/prisma/client";
import { buildUsersWhere } from "./users/build-where";
import type {
  ListUsersQuery,
  ListUsersResult,
  UserTab,
  UserStatus,
} from "./users/types";

export type { ListUsersQuery, ListUsersResult, UserTab, UserStatus };

async function isMobileTaken(
  mobile: string,
  excludeId?: EntityId,
): Promise<boolean> {
  const where: Prisma.UserWhereInput = {
    mobile,
    ...notDeleted,
    ...(excludeId != null ? { NOT: { id: toBigIntId(excludeId) } } : {}),
  };
  const row = await prisma.user.findFirst({ where, select: { id: true } });
  return row != null;
}

export async function listUsers(
  query: ListUsersQuery = {},
): Promise<ListUsersResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 10));
  const where = await buildUsersWhere(query);

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: rows.map(mapUser),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getUserTabCounts(): Promise<Record<UserTab, number>> {
  const [all, active, inactive] = await Promise.all([
    prisma.user.count({ where: { ...notDeleted } }),
    prisma.user.count({
      where: { ...notDeleted, verificationCode: { not: null } },
    }),
    prisma.user.count({
      where: { ...notDeleted, verificationCode: null },
    }),
  ]);
  return { all, active, inactive };
}

export async function createUser(
  dto: CreateUserDto,
  actorId: EntityId,
): Promise<User> {
  const mobile = normalizeMobile(dto.mobile);
  if (!mobile) {
    throw new UserServiceError("invalid_mobile", "فرمت موبایل نامعتبر است", 400);
  }
  if (await isMobileTaken(mobile)) {
    throw new UserServiceError("mobile_exists", "این موبایل قبلاً ثبت شده", 409);
  }

  const row = await prisma.user.create({
    data: {
      name: dto.name?.trim() || null,
      mobile,
      telegramChatId: telegramChatIdFromString(dto.telegramChatId),
      telegramUsername: sanitizeUsername(dto.telegramUsername),
      profileImageUrl: dto.profileImageUrl?.trim() || null,
      verificationCode: dto.verificationCode?.trim() || null,
      notes: dto.notes?.trim() || null,
    },
  });

  const user = mapUser(row);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.userCreate,
    entityType: "User",
    entityId: user.id,
    metadata: {
      mobile,
      hasCode: Boolean(user.verificationCode),
      status: getUserStatus(user),
    },
  });

  return user;
}

export async function updateUser(
  id: EntityId,
  dto: UpdateUserDto,
  actorId: EntityId,
): Promise<User> {
  const existing = await prisma.user.findFirst({
    where: { id: toBigIntId(id), ...notDeleted },
  });
  if (!existing) {
    throw new UserServiceError("not_found", "کاربر یافت نشد", 404);
  }

  const data: Prisma.UserUpdateInput = {};

  if (dto.name !== undefined) {
    data.name = dto.name?.trim() || null;
  }
  if (dto.mobile !== undefined) {
    const mobile = normalizeMobile(dto.mobile);
    if (!mobile) {
      throw new UserServiceError("invalid_mobile", "فرمت موبایل نامعتبر است", 400);
    }
    if (await isMobileTaken(mobile, id)) {
      throw new UserServiceError("mobile_exists", "این موبایل قبلاً ثبت شده", 409);
    }
    data.mobile = mobile;
  }
  if (dto.verificationCode !== undefined) {
    data.verificationCode = dto.verificationCode?.trim() || null;
  }
  if (dto.notes !== undefined) {
    data.notes = dto.notes?.trim() || null;
  }
  if (dto.telegramChatId !== undefined) {
    data.telegramChatId = telegramChatIdFromString(dto.telegramChatId);
  }
  if (dto.telegramUsername !== undefined) {
    data.telegramUsername = sanitizeUsername(dto.telegramUsername);
  }
  if (dto.profileImageUrl !== undefined) {
    data.profileImageUrl = dto.profileImageUrl?.trim() || null;
  }

  const row = await prisma.user.update({
    where: { id: toBigIntId(id) },
    data,
  });

  const user = mapUser(row);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.userUpdate,
    entityType: "User",
    entityId: user.id,
    metadata: {
      hasCode: Boolean(user.verificationCode),
      status: getUserStatus(user),
    },
  });

  return user;
}

export async function deleteUser(id: EntityId, actorId: EntityId): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { id: toBigIntId(id), ...notDeleted },
  });
  if (!existing) {
    throw new UserServiceError("not_found", "کاربر یافت نشد", 404);
  }

  const requestCount = await prisma.exchangeRequest.count({
    where: { userId: toBigIntId(id) },
  });
  if (requestCount > 0) {
    throw new UserServiceError(
      "has_requests",
      "کاربر دارای درخواست است و قابل حذف نیست",
      409,
    );
  }

  await prisma.userBankAccount.deleteMany({
    where: { userId: toBigIntId(id) },
  });

  await softDeleteUser(id);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.userDelete,
    entityType: "User",
    entityId: id,
    metadata: { mobile: existing.mobile },
  });
}

export { generateVerificationCode } from "@/lib/utils/verification-code";

function sanitizeUsername(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace(/^@/, "");
}

export class UserServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}
