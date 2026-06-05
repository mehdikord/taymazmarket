"use client";

import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { PersianCalendar } from "@/components/ui/persian-calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatJalaliFilterLabel,
  parseGregorianYmd,
  toGregorianYmd,
} from "@/lib/utils/filter-date";

type JalaliDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className,
  id,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseGregorianYmd(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 pe-9 font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4 shrink-0 opacity-60" />
            <span className="truncate">
              {value ? formatJalaliFilterLabel(value) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-0 top-0 size-9 text-muted-foreground hover:text-foreground"
            aria-label="پاک کردن تاریخ"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <PersianCalendar
          mode="single"
          selected={selected}
          onSelect={(date: Date | undefined) => {
            if (date) {
              onChange(toGregorianYmd(date));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
