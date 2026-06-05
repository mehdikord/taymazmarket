import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDashboardStats } from "@/lib/stats/dashboard";
import { getDevPanelStats } from "@/lib/dev/panel-stats";
import { prisma } from "@/lib/prisma";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const root = resolve(import.meta.dirname, "..");

async function main() {
  const required = [
    "app/(panel)/error.tsx",
    "app/(panel)/loading.tsx",
    "app/(panel)/not-found.tsx",
    "app/(panel)/settings/dev/page.tsx",
    "app/api/dev/reset/route.ts",
    "lib/dev/reset-database.ts",
    "lib/dev/panel-stats.ts",
    "components/providers.tsx",
    "components/layout/theme-toggle.tsx",
    "components/layout/dev-reset-button.tsx",
    "scripts/smoke-qa-panel.ts",
  ];

  for (const file of required) {
    assert(existsSync(resolve(root, file)), `missing ${file}`);
  }

  const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
  assert(layout.includes("Providers"), "ThemeProvider wired in layout");
  assert(layout.includes("viewport"), "viewport meta exported");

  const panelLayout = readFileSync(
    resolve(root, "app/(panel)/layout.tsx"),
    "utf8",
  );
  assert(
    panelLayout.includes('dynamic = "force-dynamic"'),
    "panel layout force-dynamic",
  );

  const header = readFileSync(
    resolve(root, "components/layout/app-header.tsx"),
    "utf8",
  );
  assert(header.includes("ThemeToggle"), "theme toggle in header");

  const dashboard = readFileSync(
    resolve(root, "app/(panel)/page.tsx"),
    "utf8",
  );
  assert(dashboard.includes("sm:grid-cols-2"), "responsive dashboard grid");

  const dialog = readFileSync(
    resolve(root, "components/ui/dialog.tsx"),
    "utf8",
  );
  assert(
    dialog.includes("max-w-[calc(100%-2rem)]"),
    "dialog full-width on mobile",
  );

  const resetRoute = readFileSync(
    resolve(root, "app/api/dev/reset/route.ts"),
    "utf8",
  );
  assert(resetRoute.includes("resetDevDatabase"), "dev reset uses DB seed");

  const stats = await getDevPanelStats();
  assert(stats.requests >= 15, "DB has 15+ requests");
  assert(stats.logs >= 50, "DB has 50+ logs");

  const dash = await getDashboardStats();
  assert(dash.pendingRequests === 5, "seed pending count for QA");

  console.log("✓ Phase 10 verification passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
