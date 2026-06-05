import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api/auth-guard";
import { parseLogsListQuery } from "@/lib/logs/parse-list-query";
import { listLogs } from "@/lib/services/logs";

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    await listLogs(
      parseLogsListQuery(Object.fromEntries(searchParams.entries())),
    ),
  );
}
