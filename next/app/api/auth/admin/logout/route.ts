import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import {
  clearSessionCookieOnResponse,
} from "@/lib/auth/session";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";

export async function POST() {
  const admin = await getCurrentAdmin();

  if (admin) {
    await appendLog({
      actorType: "admin",
      actorId: admin.id,
      action: LOG_ACTIONS.adminLogout,
      entityType: "Admin",
      entityId: admin.id,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookieOnResponse(response);
  return response;
}
