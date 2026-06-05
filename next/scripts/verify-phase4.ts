import "dotenv/config";
import {
  getDashboardStats,
  getRecentLogs,
  getRecentPendingRequests,
} from "@/lib/stats/dashboard";
import { prisma } from "@/lib/prisma";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const stats = await getDashboardStats();

  assert(stats.pendingRequests === 5, `pending: ${stats.pendingRequests}`);
  assert(stats.activeUsers === 5, `active: ${stats.activeUsers}`);
  assert(stats.inactiveUsers === 5, `inactive: ${stats.inactiveUsers}`);
  assert(stats.totalRequests === 15, `total: ${stats.totalRequests}`);
  assert(
    stats.requestBreakdown.pending +
      stats.requestBreakdown.approved +
      stats.requestBreakdown.rejected ===
      15,
    "breakdown must sum to total",
  );

  const logs = await getRecentLogs(5);
  assert(logs.length === 5, `recent logs: ${logs.length}`);

  const pending = await getRecentPendingRequests(4);
  assert(pending.length === 4, `pending preview: ${pending.length}`);
  assert(
    pending.every((r) => r.label.length > 0),
    "preview items must have labels",
  );

  console.log("✓ Phase 4 verification passed");
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
