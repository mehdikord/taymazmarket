import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const root = resolve(import.meta.dirname, "..");

const required = [
  "components/data-table/data-table.tsx",
  "components/data-table/data-table-pagination.tsx",
  "components/data-table/list-card.tsx",
  "components/shared/status-badge.tsx",
  "components/shared/confirm-dialog.tsx",
  "components/shared/fetch-error-alert.tsx",
  "components/shared/table-scroll.tsx",
];

function main() {
  for (const file of required) {
    assert(existsSync(resolve(root, file)), `missing ${file}`);
  }

  const pkg = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  ) as { dependencies: Record<string, string> };
  assert(
    !!pkg.dependencies["@tanstack/react-table"],
    "@tanstack/react-table must be installed",
  );

  console.log("✓ Phase 9 verification passed");
}

main();
