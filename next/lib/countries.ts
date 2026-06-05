import { mapCountry } from "@/lib/db/mappers";
import { prisma } from "@/lib/prisma";
import type { Country, EntityId } from "@/lib/types";
import type { CountryCode } from "@/config/countries";

let cachedCountries: Country[] | null = null;

export async function getCountries(): Promise<Country[]> {
  if (cachedCountries) return cachedCountries;
  const rows = await prisma.country.findMany({ orderBy: { code: "asc" } });
  cachedCountries = rows.map(mapCountry);
  return cachedCountries;
}

export function clearCountriesCache(): void {
  cachedCountries = null;
}

export async function findCountryByCode(
  code: CountryCode | string,
): Promise<Country | undefined> {
  const countries = await getCountries();
  return countries.find((c) => c.code === code);
}

export async function resolveCountryId(
  countryCode: CountryCode | string,
): Promise<EntityId | null> {
  const country = await findCountryByCode(countryCode);
  return country?.id ?? null;
}
