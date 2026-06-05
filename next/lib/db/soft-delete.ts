import { prisma } from "@/lib/prisma";
import type { EntityId } from "@/lib/types";
import { toBigIntId } from "./serialize";

/** Active rows only — use in all admin/user list & find queries */
export const notDeleted = { deletedAt: null } as const;

export async function softDeleteAdmin(id: EntityId) {
  return prisma.admin.update({
    where: { id: toBigIntId(id) },
    data: { deletedAt: new Date() },
  });
}

export async function softDeleteUser(id: EntityId) {
  return prisma.user.update({
    where: { id: toBigIntId(id) },
    data: { deletedAt: new Date() },
  });
}
