import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { getDashboardStats } from "@/lib/stats/dashboard";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stats = await getDashboardStats();
  return NextResponse.json(stats);
}
