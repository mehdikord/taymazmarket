import { mapAdminPublic } from "@/lib/db/mappers";
import { notDeleted } from "@/lib/db/soft-delete";
import { prisma } from "@/lib/prisma";
import type { AdminPublic } from "@/lib/types";
import { verifyPassword } from "./password";
import { normalizeMobile } from "@/lib/utils/mobile";

/**
 * Validates mobile + password against DB. Returns public admin or null.
 */
export async function authenticateAdmin(
  mobileRaw: string,
  passwordRaw: string,
): Promise<AdminPublic | null> {
  const mobile = normalizeMobile(mobileRaw);
  const password = passwordRaw.trim();
  if (!mobile || !password) return null;

  const row = await prisma.admin.findFirst({
    where: { mobile, ...notDeleted },
  });
  if (!row) return null;
  if (!(await verifyPassword(password, row.passwordHash))) return null;

  return mapAdminPublic(row);
}
