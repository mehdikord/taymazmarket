import { notDeleted } from "@/lib/db/soft-delete";
import { prisma } from "@/lib/prisma";

export type DevPanelStats = {
  admins: number;
  users: number;
  activeUsers: number;
  currencies: number;
  requests: number;
  pendingRequests: number;
  logs: number;
};

export async function getDevPanelStats(): Promise<DevPanelStats> {
  const [
    admins,
    users,
    activeUsers,
    currencies,
    requests,
    pendingRequests,
    logs,
  ] = await Promise.all([
    prisma.admin.count({ where: notDeleted }),
    prisma.user.count({ where: notDeleted }),
    prisma.user.count({
      where: { ...notDeleted, verificationCode: { not: null } },
    }),
    prisma.currency.count(),
    prisma.exchangeRequest.count(),
    prisma.exchangeRequest.count({ where: { status: "pending" } }),
    prisma.systemLog.count(),
  ]);

  return {
    admins,
    users,
    activeUsers,
    currencies,
    requests,
    pendingRequests,
    logs,
  };
}
