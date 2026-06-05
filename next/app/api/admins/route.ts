import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import {
  AdminServiceError,
  createAdmin,
  listAdmins,
} from "@/lib/services/admins";
import { adminCreateSchema } from "@/lib/validations/admin";
import { normalizeMobile } from "@/lib/utils/mobile";

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  return NextResponse.json({ items: await listAdmins(q) });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = adminCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const mobile = normalizeMobile(parsed.data.mobile)!;
    const admin = await createAdmin(
      {
        name: parsed.data.name,
        mobile,
        password: parsed.data.password,
      },
      auth.adminId,
    );
    return NextResponse.json({ admin }, { status: 201 });
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
