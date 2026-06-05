"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, type CountryCode } from "@/config/countries";
import type { CurrencyListItem } from "@/lib/services/currencies";
import {
  currencyCreateSchema,
  currencyUpdateSchema,
  type CurrencyCreateInput,
  type CurrencyUpdateInput,
} from "@/lib/validations/currency";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CurrencyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: CurrencyListItem | null;
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

const emptyCreate: CurrencyCreateInput = {
  title: "",
  slug: "",
  countryCode: "IR",
  isActive: true,
  sortOrder: null,
};

export function CurrencyFormDialog({
  open,
  onOpenChange,
  currency,
  onSuccess,
}: CurrencyFormDialogProps) {
  const isEdit = !!currency;

  const createForm = useForm<CurrencyCreateInput>({ defaultValues: emptyCreate });
  const updateForm = useForm<CurrencyUpdateInput>({ defaultValues: emptyCreate });
  const [activeChecked, setActiveChecked] = useState(true);
  const [countryCode, setCountryCode] = useState<CountryCode>("IR");

  function handleDialogOpenChange(next: boolean) {
    if (next) {
      if (currency) {
        const code = currency.countryCode as CountryCode;
        updateForm.reset({
          title: currency.title,
          slug: currency.slug,
          countryCode: code,
          isActive: currency.isActive,
          sortOrder: currency.sortOrder,
        });
        setActiveChecked(currency.isActive);
        setCountryCode(code);
      } else {
        createForm.reset(emptyCreate);
        setActiveChecked(true);
        setCountryCode("IR");
      }
    }
    onOpenChange(next);
  }

  async function onCreateSubmit(values: CurrencyCreateInput) {
    const parsed = currencyCreateSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(createForm.setError, parsed.error.flatten().fieldErrors);
      return;
    }
    const res = await fetch("/api/currencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((data as { message?: string }).message ?? "ثبت ناموفق");
      return;
    }
    toast.success("ارز جدید ثبت شد");
    onOpenChange(false);
    onSuccess();
  }

  async function onUpdateSubmit(values: CurrencyUpdateInput) {
    if (!currency) return;
    const parsed = currencyUpdateSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(updateForm.setError, parsed.error.flatten().fieldErrors);
      return;
    }
    const res = await fetch(`/api/currencies/${currency.id}`, {
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

  const form = isEdit ? updateForm : createForm;
  const onSubmit = isEdit
    ? updateForm.handleSubmit(onUpdateSubmit)
    : createForm.handleSubmit(onCreateSubmit);
  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;
  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش ارز" : "ارز جدید"}</DialogTitle>
          <DialogDescription>
            ارزهای غیرفعال در ربات نمایش داده نمی‌شوند
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="عنوان" error={errors.title?.message}>
            <Input {...form.register("title")} />
          </Field>
          <Field label="شناسه (slug)" error={errors.slug?.message}>
            <Input
              dir="ltr"
              placeholder="usd"
              {...form.register("slug")}
            />
            <p className="text-xs text-muted-foreground">
              فقط حروف انگلیسی کوچک، عدد و خط تیره
            </p>
          </Field>
          <Field label="کشور" error={errors.countryCode?.message}>
            <Select
              value={countryCode}
              onValueChange={(v) => {
                const code = v as CountryCode;
                setCountryCode(code);
                if (isEdit) {
                  updateForm.setValue("countryCode", code, { shouldDirty: true });
                } else {
                  createForm.setValue("countryCode", code, { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name_fa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="ترتیب نمایش" error={errors.sortOrder?.message}>
            <Input
              type="number"
              dir="ltr"
              placeholder="اختیاری"
              {...form.register("sortOrder", {
                setValueAs: (v) =>
                  v === "" || v == null ? null : Number(v),
              })}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox
              id="currency-active"
              checked={activeChecked}
              onCheckedChange={(v) => {
                const next = v === true;
                setActiveChecked(next);
                if (isEdit) {
                  updateForm.setValue("isActive", next, { shouldDirty: true });
                } else {
                  createForm.setValue("isActive", next, { shouldDirty: true });
                }
              }}
            />
            <Label htmlFor="currency-active" className="cursor-pointer">
              فعال (نمایش در ربات)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
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
