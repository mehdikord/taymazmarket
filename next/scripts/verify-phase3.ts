import "dotenv/config";
import {
  createSessionToken,
  resolveSessionAdminId,
} from "@/lib/auth/session";
import { authenticateAdmin } from "@/lib/auth/authenticate-admin";
import { PANEL_NAV } from "@/config/navigation";
import { getDashboardStats } from "@/lib/stats/dashboard";
import { prisma } from "@/lib/prisma";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main() {
  const admin = await authenticateAdmin("989121111111", "admin123");
  assert(Boolean(admin), "demo admin must exist in DB");
  assert(admin!.mobile === "989121111111", "demo admin mobile");

  const token = createSessionToken(admin!.id);
  assert(
    resolveSessionAdminId(token) === admin!.id,
    "signed session token must resolve to admin id",
  );
  assert(token.split(".").length === 3, "session token is signed payload");
  assert(
    resolveSessionAdminId("invalid-token") === null,
    "invalid token must return null",
  );
  assert(
    resolveSessionAdminId(undefined) === null,
    "missing token must return null",
  );

  const stats = await getDashboardStats();
  assert(stats.pendingRequests === 5, `expected 5 pending, got ${stats.pendingRequests}`);

  const navHrefs = PANEL_NAV.flatMap((g) => g.items.map((i) => i.href));
  const expected = [
    "/",
    "/admins",
    "/users",
    "/requests/new",
    "/requests/history",
    "/settings/currencies",
    "/settings/logs",
  ];
  for (const href of expected) {
    assert(navHrefs.includes(href), `navigation missing ${href}`);
  }

  const newRequestsItem = PANEL_NAV.flatMap((g) => g.items).find(
    (i) => i.href === "/requests/new",
  );
  assert(
    newRequestsItem?.badge === "pendingRequests",
    "new requests nav must have pending badge key",
  );

  console.log("✓ Phase 3 verification passed");
  console.log(
    JSON.stringify({ pendingRequests: stats.pendingRequests, navItems: navHrefs.length }, null, 2),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
