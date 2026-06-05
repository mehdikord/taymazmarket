import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import { parseRequestsListQuery } from "@/lib/requests/parse-list-query";
import { listRequests } from "@/lib/services/requests";

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    await listRequests(
      parseRequestsListQuery(Object.fromEntries(searchParams.entries())),
    ),
  );
}
