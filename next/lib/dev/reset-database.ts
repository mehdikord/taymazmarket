import { runSeed } from "@/prisma/seed/run";

/** پاک‌سازی و seed مجدد — فقط development (`/api/dev/reset`). */
export async function resetDevDatabase(): Promise<void> {
  await runSeed();
}
