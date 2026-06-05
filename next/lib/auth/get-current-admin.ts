import { mapAdminPublic } from "@/lib/db/mappers";
import { notDeleted } from "@/lib/db/soft-delete";
import { toBigIntId } from "@/lib/db/serialize";
import { prisma } from "@/lib/prisma";
import type { AdminPublic } from "@/lib/types";
import { getSessionAdminId } from "./session";

export async function getCurrentAdmin(): Promise<AdminPublic | null> {
  const adminId = await getSessionAdminId();
  if (!adminId) return null;

  const row = await prisma.admin.findFirst({
    where: { id: toBigIntId(adminId), ...notDeleted },
  });
  if (!row) return null;

  return mapAdminPublic(row);
}
