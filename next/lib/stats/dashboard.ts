import { mapExchangeRequest, mapSystemLog } from "@/lib/db/mappers";
import { notDeleted } from "@/lib/db/soft-delete";
import { prisma } from "@/lib/prisma";
import type { ExchangeRequest, SystemLog } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format-number";

export type DashboardStats = {
  pendingRequests: number;
  requestsToday: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRequests: number;
  requestBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
  };
};

export type PendingRequestPreviewItem = {
  id: number;
  trackingCode: string;
  createdAt: string;
  amount: number;
  label: string;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = startOfToday();

  const [
    pendingRequests,
    approved,
    rejected,
    requestsToday,
    totalRequests,
    activeUsers,
    inactiveUsers,
  ] = await Promise.all([
    prisma.exchangeRequest.count({ where: { status: "pending" } }),
    prisma.exchangeRequest.count({ where: { status: "approved" } }),
    prisma.exchangeRequest.count({ where: { status: "rejected" } }),
    prisma.exchangeRequest.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.exchangeRequest.count(),
    prisma.user.count({
      where: { ...notDeleted, verificationCode: { not: null } },
    }),
    prisma.user.count({
      where: { ...notDeleted, verificationCode: null },
    }),
  ]);

  return {
    pendingRequests,
    requestsToday,
    activeUsers,
    inactiveUsers,
    totalRequests,
    requestBreakdown: {
      pending: pendingRequests,
      approved,
      rejected,
    },
  };
}

export async function getRecentLogs(limit = 5): Promise<SystemLog[]> {
  const rows = await prisma.systemLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapSystemLog);
}

export async function getRecentPendingRequests(
  limit = 5,
): Promise<PendingRequestPreviewItem[]> {
  const rows = await prisma.exchangeRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, mobile: true } },
      sourceCurrency: { select: { title: true } },
      targetCurrency: { select: { title: true } },
    },
  });

  return rows.map((row) => {
    const request = mapExchangeRequest(row);
    const userLabel = row.user.name ?? row.user.mobile ?? "کاربر";
    const source = row.sourceCurrency.title;
    const target = row.targetCurrency.title;
    return {
      id: request.id,
      trackingCode: request.trackingCode,
      createdAt: request.createdAt,
      amount: request.amount,
      label: `${userLabel} · ${source} → ${target} · ${formatNumber(request.amount)}`,
    };
  });
}
