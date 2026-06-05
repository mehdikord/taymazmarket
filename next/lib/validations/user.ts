import { z } from "zod";
import { normalizeMobile } from "@/lib/utils/mobile";

const mobileField = z
  .string()
  .min(1, "شماره موبایل الزامی است")
  .refine((v) => normalizeMobile(v) !== null, {
    message: "فرمت موبایل صحیح نیست (مثال: 989121111111)",
  });

const optionalString = z.string().optional().nullable();

export const userCreateSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  mobile: mobileField,
  verificationCode: z.string().max(64).optional().nullable(),
  notes: optionalString,
  telegramChatId: optionalString,
  telegramUsername: optionalString,
  profileImageUrl: z.string().max(500).optional().nullable(),
});

export const userUpdateSchema = userCreateSchema.partial().extend({
  mobile: mobileField.optional(),
});

function refineVerificationCode(
  data: { verificationCode?: string | null },
  ctx: z.RefinementCtx,
) {
  const code = data.verificationCode?.trim();
  if (code && code.length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "کد تایید حداقل ۴ کاراکتر",
      path: ["verificationCode"],
    });
  }
}

export const userCreateSchemaValidated = userCreateSchema.superRefine(
  refineVerificationCode,
);

export const userUpdateSchemaValidated = userUpdateSchema.superRefine(
  refineVerificationCode,
);

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
