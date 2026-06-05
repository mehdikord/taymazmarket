import { mapSystemLog } from "@/lib/db/mappers";
import { toBigIntId } from "@/lib/db/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { EntityId, LogActorType, SystemLog } from "@/lib/types";
import { sanitizeLogMetadata } from "./sanitize-metadata";

export type AppendLogInput = {
  actorType: LogActorType;
  actorId?: EntityId | null;
  action: string;
  entityType: string;
  entityId?: EntityId | null;
  metadata?: Record<string, unknown> | null;
};

export async function appendLog(input: AppendLogInput): Promise<SystemLog> {
  const row = await prisma.systemLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId != null ? toBigIntId(input.actorId) : null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId != null ? toBigIntId(input.entityId) : null,
      metadata: sanitizeLogMetadata(input.metadata) as Prisma.InputJsonValue | undefined,
    },
  });
  return mapSystemLog(row);
}
