import { NextResponse } from "next/server";
import { resetDevDatabase } from "@/lib/dev/reset-database";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await resetDevDatabase();
  return NextResponse.json({ ok: true });
}
