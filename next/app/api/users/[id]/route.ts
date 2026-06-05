import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import {
  UserServiceError,
  deleteUser,
  updateUser,
} from "@/lib/services/users";
import { userUpdateSchemaValidated } from "@/lib/validations/user";
import { normalizeMobile } from "@/lib/utils/mobile";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = userUpdateSchemaValidated.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const dto: Parameters<typeof updateUser>[1] = {};
    if (data.name !== undefined) dto.name = data.name;
    if (data.mobile !== undefined) {
      dto.mobile = normalizeMobile(data.mobile) ?? data.mobile;
    }
    if (data.verificationCode !== undefined) {
      dto.verificationCode = data.verificationCode?.trim() || null;
    }
    if (data.notes !== undefined) dto.notes = data.notes;
    if (data.telegramChatId !== undefined) dto.telegramChatId = data.telegramChatId;
    if (data.telegramUsername !== undefined) {
      dto.telegramUsername = data.telegramUsername;
    }
    if (data.profileImageUrl !== undefined) {
      dto.profileImageUrl = data.profileImageUrl;
    }

    const user = await updateUser(id, dto, auth.adminId);
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof UserServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: e.status },
      );
    }
    throw e;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: idParam } = await context.params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    await deleteUser(id, auth.adminId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UserServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: e.status },
      );
    }
    throw e;
  }
}
