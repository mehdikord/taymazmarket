import { mapSystemLog } from "@/lib/db/mappers";
import { notDeleted } from "@/lib/db/soft-delete";
import { toBigIntId } from "@/lib/db/serialize";
import { prisma } from "@/lib/prisma";
import type { EntityId, LogActorType, SystemLog } from "@/lib/types";
import { buildLogsWhere } from "./logs/build-where";

export type ListLogsQuery = {
  actorType?: LogActorType;
  actorId?: EntityId;
  action?: string;
  entityType?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
};

export type LogListItem = SystemLog & {
  actorDisplayName: string | null;
};

export type ListLogsResult = {
  items: LogListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function resolveActorNames(
  logs: SystemLog[],
): Promise<Map<string, string | null>> {
  const adminIds = new Set<bigint>();
  const userIds = new Set<bigint>();

  for (const log of logs) {
    if (log.actorId == null) continue;
    const id = toBigIntId(log.actorId);
    if (log.actorType === "admin") adminIds.add(id);
    else if (log.actorType === "user") userIds.add(id);
  }

  const names = new Map<string, string | null>();

  if (adminIds.size > 0) {
    const admins = await prisma.admin.findMany({
      where: { id: { in: [...adminIds] }, ...notDeleted },
      select: { id: true, name: true },
    });
    for (const a of admins) {
      names.set(`admin:${a.id}`, a.name);
    }
  }

  if (userIds.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] }, ...notDeleted },
      select: { id: true, name: true, mobile: true },
    });
    for (const u of users) {
      names.set(`user:${u.id}`, u.name ?? u.mobile);
    }
  }

  return names;
}

function enrichLog(
  log: SystemLog,
  names: Map<string, string | null>,
): LogListItem {
  let actorDisplayName: string | null = null;
  if (log.actorId != null) {
    actorDisplayName =
      names.get(`${log.actorType}:${toBigIntId(log.actorId)}`) ?? null;
  }
  return { ...log, actorDisplayName };
}

export async function listLogs(
  query: ListLogsQuery = {},
): Promise<ListLogsResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 20));
  const where = buildLogsWhere(query);

  const [total, rows] = await Promise.all([
    prisma.systemLog.count({ where }),
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const logs = rows.map(mapSystemLog);
  const names = await resolveActorNames(logs);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: logs.map((log) => enrichLog(log, names)),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getLog(id: EntityId): Promise<LogListItem | undefined> {
  const row = await prisma.systemLog.findUnique({
    where: { id: toBigIntId(id) },
  });
  if (!row) return undefined;
  const log = mapSystemLog(row);
  const names = await resolveActorNames([log]);
  return enrichLog(log, names);
}
