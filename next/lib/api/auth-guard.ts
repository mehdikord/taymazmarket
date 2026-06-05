import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export async function requireApiAdmin(): Promise<
  { adminId: number } | NextResponse
> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return { adminId: admin.id };
}
