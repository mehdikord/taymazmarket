import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import {
  AdminServiceError,
  deleteAdmin,
  updateAdmin,
} from "@/lib/services/admins";
import { adminUpdateSchema } from "@/lib/validations/admin";
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

  const parsed = adminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const dto: Parameters<typeof updateAdmin>[1] = {};
    if (parsed.data.name !== undefined) dto.name = parsed.data.name;
    if (parsed.data.mobile !== undefined) {
      dto.mobile = normalizeMobile(parsed.data.mobile) ?? parsed.data.mobile;
    }
    if (parsed.data.password) dto.password = parsed.data.password;

    const admin = await updateAdmin(id, dto, auth.adminId);
    return NextResponse.json({ admin });
  } catch (e) {
    if (e instanceof AdminServiceError) {
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
    await deleteAdmin(id, auth.adminId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: e.status },
      );
    }
    throw e;
  }
}
