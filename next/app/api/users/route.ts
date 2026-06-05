import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import {
  UserServiceError,
  createUser,
  listUsers,
  type ListUsersQuery,
} from "@/lib/services/users";
import { parseUsersListQuery } from "@/lib/users/parse-list-query";
import {
  userCreateSchemaValidated,
} from "@/lib/validations/user";
import { normalizeMobile } from "@/lib/utils/mobile";

function parseListQuery(searchParams: URLSearchParams): ListUsersQuery {
  return parseUsersListQuery(
    Object.fromEntries(searchParams.entries()),
  );
}

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    await listUsers(parseListQuery(searchParams)),
  );
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

  const parsed = userCreateSchemaValidated.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const user = await createUser(
      {
        name: data.name,
        mobile: normalizeMobile(data.mobile)!,
        verificationCode: data.verificationCode?.trim() || null,
        notes: data.notes,
        telegramChatId: data.telegramChatId,
        telegramUsername: data.telegramUsername,
        profileImageUrl: data.profileImageUrl,
      },
      auth.adminId,
    );
    return NextResponse.json({ user }, { status: 201 });
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
