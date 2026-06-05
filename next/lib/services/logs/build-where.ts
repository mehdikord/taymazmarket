import { createdAtWhere } from "@/lib/db/dates";
import { toBigIntId } from "@/lib/db/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ListLogsQuery } from "../logs";

export function buildLogsWhere(query: ListLogsQuery): Prisma.SystemLogWhereInput {
  const where: Prisma.SystemLogWhereInput = {};

  if (query.actorType) {
    where.actorType = query.actorType;
  }

  if (query.actorId != null) {
    where.actorId = toBigIntId(query.actorId);
  }

  if (query.action?.trim()) {
    where.action = { contains: query.action.trim() };
  }

  if (query.entityType?.trim()) {
    where.entityType = query.entityType.trim();
  }

  Object.assign(where, createdAtWhere(query.createdFrom, query.createdTo));

  return where;
}
