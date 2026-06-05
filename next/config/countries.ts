export const COUNTRIES = [
  { code: "IR", name_fa: "ایران", name_en: "Iran", phone_prefix: "98" },
  { code: "TR", name_fa: "ترکیه", name_en: "Turkey", phone_prefix: "90" },
  { code: "US", name_fa: "آمریکا", name_en: "United States", phone_prefix: "1" },
  { code: "DE", name_fa: "آلمان", name_en: "Germany", phone_prefix: "49" },
  { code: "AE", name_fa: "امارات", name_en: "UAE", phone_prefix: "971" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
