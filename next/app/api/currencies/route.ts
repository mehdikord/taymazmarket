import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import {
  CurrencyServiceError,
  createCurrencyFromCode,
  listCurrencies,
} from "@/lib/services/currencies";
import { currencyCreateSchema } from "@/lib/validations/currency";

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") === "true";

  return NextResponse.json({ items: await listCurrencies(activeOnly) });
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

  const parsed = currencyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const currency = await createCurrencyFromCode(
      {
        title: data.title,
        slug: data.slug,
        countryCode: data.countryCode,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      auth.adminId,
    );
    return NextResponse.json({ currency }, { status: 201 });
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
