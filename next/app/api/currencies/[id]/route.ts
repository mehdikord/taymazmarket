import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import {
  CurrencyServiceError,
  deleteCurrency,
  updateCurrencyFromCode,
} from "@/lib/services/currencies";
import { currencyUpdateSchema } from "@/lib/validations/currency";

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

  const parsed = currencyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const currency = await updateCurrencyFromCode(
      id,
      parsed.data,
      auth.adminId,
    );
    return NextResponse.json({ currency });
  } catch (e) {
    if (e instanceof CurrencyServiceError) {
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
    await deleteCurrency(id, auth.adminId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof CurrencyServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: e.status },
      );
    }
    throw e;
  }
}
