import { redirect } from "next/navigation";
import type { AdminPublic } from "@/lib/types";
import { getCurrentAdmin } from "./get-current-admin";

export async function requireAdmin(): Promise<AdminPublic> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }
  return admin;
}
