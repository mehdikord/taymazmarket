import { z } from "zod";
import { normalizeMobile } from "@/lib/utils/mobile";

export const adminCreateSchema = z.object({
  name: z
    .string()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(100, "نام حداکثر ۱۰۰ کاراکتر"),
  mobile: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .refine((v) => normalizeMobile(v) !== null, {
      message: "فرمت موبایل صحیح نیست (مثال: 989121111111)",
    }),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .max(128, "رمز عبور خیلی طولانی است"),
});

export const adminUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(100, "نام حداکثر ۱۰۰ کاراکتر")
    .optional(),
  mobile: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .refine((v) => normalizeMobile(v) !== null, {
      message: "فرمت موبایل صحیح نیست",
    })
    .optional(),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .max(128, "رمز عبور خیلی طولانی است")
    .optional(),
});

export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;
