import { z } from "zod";

export const requestRejectSchema = z.object({
  reason: z
    .string()
    .min(1, "دلیل رد الزامی است")
    .transform((v) => v.trim())
    .pipe(z.string().min(3, "دلیل رد حداقل ۳ کاراکتر")),
});

export type RequestRejectInput = z.infer<typeof requestRejectSchema>;
