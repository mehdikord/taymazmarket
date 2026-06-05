import { mapAdminPublic } from "@/lib/db/mappers";
import { notDeleted, softDeleteAdmin } from "@/lib/db/soft-delete";
import { toBigIntId } from "@/lib/db/serialize";
import { hashPassword } from "@/lib/auth/password";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { prisma } from "@/lib/prisma";
import type { AdminPublic, EntityId } from "@/lib/types";
import type { CreateAdminDto, UpdateAdminDto } from "@/lib/types/dto";
import { normalizeMobile } from "@/lib/utils/mobile";
import type { Prisma } from "@/lib/generated/prisma/client";

async function isMobileTaken(
  mobile: string,
  excludeId?: EntityId,
): Promise<boolean> {
  const where: Prisma.AdminWhereInput = {
    mobile,
    ...notDeleted,
    ...(excludeId != null ? { NOT: { id: toBigIntId(excludeId) } } : {}),
  };
  const row = await prisma.admin.findFirst({ where, select: { id: true } });
  return row != null;
}

export async function listAdmins(query?: string): Promise<AdminPublic[]> {
  const q = query?.trim().toLowerCase();
  const where: Prisma.AdminWhereInput = {
    ...notDeleted,
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { mobile: { contains: q.replace(/\s/g, "") } },
          ],
        }
      : {}),
  };

  const rows = await prisma.admin.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapAdminPublic);
}

export async function createAdmin(
  dto: CreateAdminDto,
  actorId: EntityId,
): Promise<AdminPublic> {
  const mobile = normalizeMobile(dto.mobile);
  if (!mobile) {
    throw new AdminServiceError("invalid_mobile", "فرمت موبایل نامعتبر است", 400);
  }
  if (await isMobileTaken(mobile)) {
    throw new AdminServiceError("mobile_exists", "این موبایل قبلاً ثبت شده", 409);
  }

  const row = await prisma.admin.create({
    data: {
      name: dto.name.trim(),
      mobile,
      passwordHash: await hashPassword(dto.password),
    },
  });

  const admin = mapAdminPublic(row);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.adminCreate,
    entityType: "Admin",
    entityId: admin.id,
    metadata: { mobile },
  });

  return admin;
}

export async function updateAdmin(
  id: EntityId,
  dto: UpdateAdminDto,
  actorId: EntityId,
): Promise<AdminPublic> {
  const existing = await prisma.admin.findFirst({
    where: { id: toBigIntId(id), ...notDeleted },
  });
  if (!existing) {
    throw new AdminServiceError("not_found", "مدیر یافت نشد", 404);
  }

  const data: Prisma.AdminUpdateInput = {};

  if (dto.name !== undefined) {
    data.name = dto.name.trim();
  }

  if (dto.mobile !== undefined) {
    const mobile = normalizeMobile(dto.mobile);
    if (!mobile) {
      throw new AdminServiceError("invalid_mobile", "فرمت موبایل نامعتبر است", 400);
    }
    if (await isMobileTaken(mobile, id)) {
      throw new AdminServiceError("mobile_exists", "این موبایل قبلاً ثبت شده", 409);
    }
    data.mobile = mobile;
  }

  if (dto.password !== undefined && dto.password.length > 0) {
    data.passwordHash = await hashPassword(dto.password);
  }

  const row = await prisma.admin.update({
    where: { id: toBigIntId(id) },
    data,
  });

  const admin = mapAdminPublic(row);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.adminUpdate,
    entityType: "Admin",
    entityId: admin.id,
  });

  return admin;
}

export async function deleteAdmin(id: EntityId, actorId: EntityId): Promise<void> {
  if (id === actorId) {
    throw new AdminServiceError(
      "cannot_delete_self",
      "امکان حذف حساب خودتان وجود ندارد",
      403,
    );
  }

  const existing = await prisma.admin.findFirst({
    where: { id: toBigIntId(id), ...notDeleted },
  });
  if (!existing) {
    throw new AdminServiceError("not_found", "مدیر یافت نشد", 404);
  }

  await softDeleteAdmin(id);

  await appendLog({
    actorType: "admin",
    actorId,
    action: LOG_ACTIONS.adminDelete,
    entityType: "Admin",
    entityId: id,
    metadata: { name: existing.name },
  });
}

export class AdminServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AdminServiceError";
  }
}
