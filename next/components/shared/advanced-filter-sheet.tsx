"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { JalaliDatePicker } from "@/components/shared/jalali-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FilterFieldConfig =
  | {
      type: "text";
      name: string;
      label: string;
      placeholder?: string;
      dir?: "ltr" | "rtl";
    }
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | {
      type: "date";
      name: string;
      label: string;
    }
  | {
      type: "number";
      name: string;
      label: string;
      placeholder?: string;
    };

export type FilterValues = Record<string, string>;

type AdvancedFilterSheetProps = {
  fields: FilterFieldConfig[];
  appliedValues: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
  activeCount: number;
};

export function AdvancedFilterSheet({
  fields,
  appliedValues,
  onApply,
  onReset,
  activeCount,
}: AdvancedFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(appliedValues);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(appliedValues);
    setOpen(next);
  }

  function handleChange(name: string, value: string) {
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" />
          فیلتر پیشرفته
          {activeCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>فیلتر پیشرفته</SheetTitle>
          <SheetDescription>
            ترکیب چند فیلد برای محدود کردن نتایج
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 py-2">
          {fields.map((field) => {
            if (field.type === "select") {
              return (
                <div key={field.name} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Select
                    value={draft[field.name] || "all"}
                    onValueChange={(v) =>
                      handleChange(field.name, v === "all" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem
                          key={opt.value || "all"}
                          value={opt.value || "all"}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }
            if (field.type === "date") {
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                  <JalaliDatePicker
                    id={`filter-${field.name}`}
                    value={draft[field.name] ?? ""}
                    onChange={(v) => handleChange(field.name, v)}
                  />
                </div>
              );
            }
            if (field.type === "number") {
              return (
                <div key={field.name} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    type="number"
                    dir="ltr"
                    placeholder={field.placeholder}
                    value={draft[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                </div>
              );
            }
            return (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  placeholder={field.placeholder}
                  dir={field.dir}
                  value={draft[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              </div>
            );
          })}
        </div>
        <SheetFooter className="flex-row gap-2 sm:justify-start">
          <Button
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            اعمال فیلتر
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
          >
            پاک کردن
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
