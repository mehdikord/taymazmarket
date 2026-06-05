import { requireAdmin } from "@/lib/auth/require-admin";
import { listCurrencies } from "@/lib/services/currencies";
import { CurrenciesPageClient } from "@/components/settings/currencies-page-client";

export default async function CurrenciesPage() {
  await requireAdmin();
  const initialItems = await listCurrencies();

  return <CurrenciesPageClient initialItems={initialItems} />;
}
