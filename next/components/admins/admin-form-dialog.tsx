"use client";

import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminPublic } from "@/lib/types";
import {
  adminCreateSchema,
  adminUpdateSchema,
  type AdminCreateInput,
  type AdminUpdateInput,
} from "@/lib/validations/admin";
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

type AdminFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin?: AdminPublic | null;
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

export function AdminFormDialog({
  open,
  onOpenChange,
  admin,
  onSuccess,
}: AdminFormDialogProps) {
  const isEdit = !!admin;

  const createForm = useForm<AdminCreateInput>({
    defaultValues: { name: "", mobile: "", password: "" },
  });

  const updateForm = useForm<AdminUpdateInput>({
    defaultValues: { name: "", mobile: "", password: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (admin) {
      updateForm.reset({
        name: admin.name,
        mobile: admin.mobile,
        password: "",
      });
    } else {
      createForm.reset({ name: "", mobile: "", password: "" });
    }
  }, [open, admin, createForm, updateForm]);

  async function onCreateSubmit(values: AdminCreateInput) {
    const parsed = adminCreateSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(
        createForm.setError,
        parsed.error.flatten().fieldErrors,
      );
      return;
    }

    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(
        (data as { message?: string }).message ?? "ثبت مدیر ناموفق بود",
      );
      return;
    }

    toast.success("مدیر جدید ثبت شد");
    onOpenChange(false);
    onSuccess();
  }

  async function onUpdateSubmit(values: AdminUpdateInput) {
    if (!admin) return;
    const parsed = adminUpdateSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(
        updateForm.setError,
        parsed.error.flatten().fieldErrors,
      );
      return;
    }

    const res = await fetch(`/api/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(
        (data as { message?: string }).message ?? "ویرایش ناموفق بود",
      );
      return;
    }

    toast.success("تغییرات ذخیره شد");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش مدیر" : "مدیر جدید"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "رمز را خالی بگذارید اگر نمی‌خواهید تغییر کند."
              : "موبایل با کد کشور بدون + وارد شود."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <form
            onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
            className="space-y-4"
          >
            <Field
              id="edit-name"
              label="نام"
              error={updateForm.formState.errors.name?.message}
              input={
                <Input id="edit-name" {...updateForm.register("name")} />
              }
            />
            <Field
              id="edit-mobile"
              label="موبایل"
              error={updateForm.formState.errors.mobile?.message}
              input={
                <Input
                  id="edit-mobile"
                  dir="ltr"
                  placeholder="989121111111"
                  {...updateForm.register("mobile")}
                />
              }
            />
            <Field
              id="edit-password"
              label="رمز عبور جدید (اختیاری)"
              error={updateForm.formState.errors.password?.message}
              input={
                <Input
                  id="edit-password"
                  type="password"
                  autoComplete="new-password"
                  {...updateForm.register("password")}
                />
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={updateForm.formState.isSubmitting}>
                {updateForm.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <Field
              id="create-name"
              label="نام"
              error={createForm.formState.errors.name?.message}
              input={
                <Input id="create-name" {...createForm.register("name")} />
              }
            />
            <Field
              id="create-mobile"
              label="موبایل"
              error={createForm.formState.errors.mobile?.message}
              input={
                <Input
                  id="create-mobile"
                  dir="ltr"
                  placeholder="989121111111"
                  {...createForm.register("mobile")}
                />
              }
            />
            <Field
              id="create-password"
              label="رمز عبور"
              error={createForm.formState.errors.password?.message}
              input={
                <Input
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  {...createForm.register("password")}
                />
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                ایجاد
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  error,
  input,
}: {
  id: string;
  label: string;
  error?: string;
  input: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
