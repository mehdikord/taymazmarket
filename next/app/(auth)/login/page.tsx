import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/");
  }

  return <LoginForm />;
}
