import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ admin });
}
