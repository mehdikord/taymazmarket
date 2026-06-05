import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth/authenticate-admin";
import {
  applySessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import { appendLog } from "@/lib/logging/append-log";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { normalizeMobile } from "@/lib/utils/mobile";

export async function POST(request: Request) {
  let body: { mobile?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }

  const mobile = normalizeMobile(body.mobile ?? "");
  const password = body.password?.trim();

  if (!mobile || !password) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const admin = await authenticateAdmin(mobile, password);
  if (!admin) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = createSessionToken(admin.id);

  await appendLog({
    actorType: "admin",
    actorId: admin.id,
    action: LOG_ACTIONS.adminLogin,
    entityType: "Admin",
    entityId: admin.id,
    metadata: { mobile },
  });

  const response = NextResponse.json({
    ok: true,
    admin,
  });
  applySessionCookie(response, token);
  return response;
}
