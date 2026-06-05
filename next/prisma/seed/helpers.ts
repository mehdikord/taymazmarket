import type { PrismaClient } from "../../lib/generated/prisma/client";

export function daysAgoDate(days: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** پاک‌سازی همه داده‌ها — ترتیب معکوس FK */
export async function clearSeedData(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.systemLog.deleteMany(),
    prisma.exchangeRequest.deleteMany(),
    prisma.userBankAccount.deleteMany(),
    prisma.currency.deleteMany(),
    prisma.user.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.country.deleteMany(),
  ]);
}
