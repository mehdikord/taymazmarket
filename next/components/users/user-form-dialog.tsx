"use client";

import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { generateVerificationCode } from "@/lib/utils/verification-code";
import {
  userCreateSchemaValidated,
  userUpdateSchemaValidated,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
};

function applyZodErrors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: any,
  fieldErrors: Record<string, string[] | undefined>,
) {
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) {
      setError(key, { message: messages[0] });
    }
  }
}

const emptyCreate: UserCreateInput = {
  name: "",
  mobile: "",
  verificationCode: "",
  notes: "",
  telegramChatId: "",
  telegramUsername: "",
  profileImageUrl: "",
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const isEdit = !!user;

  const createForm = useForm<UserCreateInput>({ defaultValues: emptyCreate });
  const updateForm = useForm<UserUpdateInput>({ defaultValues: emptyCreate });

  useEffect(() => {
    if (!open) return;
    if (user) {
      updateForm.reset({
        name: user.name ?? "",
        mobile: user.mobile,
        verificationCode: user.verificationCode ?? "",
        notes: user.notes ?? "",
        telegramChatId: user.telegramChatId ?? "",
        telegramUsername: user.telegramUsername ?? "",
        profileImageUrl: user.profileImageUrl ?? "",
      });
    } else {
      createForm.reset(emptyCreate);
    }
  }, [open, user, createForm, updateForm]);

  async function onCreateSubmit(values: UserCreateInput) {
    const parsed = userCreateSchemaValidated.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(createForm.setError, parsed.error.flatten().fieldErrors);
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((data as { message?: string }).message ?? "ثبت ناموفق");
      return;
    }
    toast.success("کاربر جدید ثبت شد");
    onOpenChange(false);
    onSuccess();
  }

  async function onUpdateSubmit(values: UserUpdateInput) {
    if (!user) return;
    const parsed = userUpdateSchemaValidated.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(updateForm.setError, parsed.error.flatten().fieldErrors);
      return;
    }
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((data as { message?: string }).message ?? "ویرایش ناموفق");
      return;
    }
    toast.success("تغییرات ذخیره شد");
    onOpenChange(false);
    onSuccess();
  }

  function handleGenerateCode() {
    const code = generateVerificationCode();
    form.setValue("verificationCode", code, { shouldDirty: true });
    toast.success(`کد جدید: ${code}`);
  }

  const form = isEdit ? updateForm : createForm;
  const onSubmit = isEdit
    ? updateForm.handleSubmit(onUpdateSubmit)
    : createForm.handleSubmit(onCreateSubmit);
  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش کاربر" : "کاربر جدید"}</DialogTitle>
          <DialogDescription>
            اطلاعات مشتری ربات — موبایل با کد کشور بدون +
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="نام" error={errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="موبایل" error={errors.mobile?.message}>
            <Input
              dir="ltr"
              placeholder="989121111111"
              {...form.register("mobile")}
            />
          </Field>
          <Field label="کد تایید" error={errors.verificationCode?.message}>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                className="font-mono"
                {...form.register("verificationCode")}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={handleGenerateCode}
              >
                <KeyRound className="size-4" />
                تولید
              </Button>
            </div>
          </Field>
          <Field label="نام کاربری تلگرام" error={errors.telegramUsername?.message}>
            <Input
              dir="ltr"
              placeholder="username"
              {...form.register("telegramUsername")}
            />
          </Field>
          <Field label="Chat ID" error={errors.telegramChatId?.message}>
            <Input
              dir="ltr"
              className="font-mono"
              {...form.register("telegramChatId")}
            />
          </Field>
          <Field label="آدرس تصویر پروفایل" error={errors.profileImageUrl?.message}>
            <Input dir="ltr" {...form.register("profileImageUrl")} />
          </Field>
          <Field label="توضیحات" error={errors.notes?.message}>
            <Textarea rows={3} {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "ذخیره" : "ایجاد"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
