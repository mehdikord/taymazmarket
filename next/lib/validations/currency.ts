import { z } from "zod";
import { COUNTRIES } from "@/config/countries";

const countryCodes = COUNTRIES.map((c) => c.code) as [
  (typeof COUNTRIES)[number]["code"],
  ...(typeof COUNTRIES)[number]["code"][],
];

const slugField = z
  .string()
  .min(1, "شناسه انگلیسی الزامی است")
  .max(64)
  .regex(/^[a-z0-9-]+$/, "فقط حروف انگلیسی کوچک، عدد و خط تیره");

export const currencyCreateSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").max(100),
  slug: slugField,
  countryCode: z.enum(countryCodes, {
    error: "کشور نامعتبر است",
  }),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nullable().optional(),
});

export const currencyUpdateSchema = currencyCreateSchema.partial();

export type CurrencyCreateInput = z.infer<typeof currencyCreateSchema>;
export type CurrencyUpdateInput = z.infer<typeof currencyUpdateSchema>;
