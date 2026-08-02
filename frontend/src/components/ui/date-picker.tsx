"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A custom calendar so the labels are always Spanish (Colombia), regardless
// of the visitor's OS/browser language — the native <input type="date">
// picker follows OS/browser locale inconsistently across browsers, which is
// exactly what made it show up in English despite the page's lang attribute.
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getCalendarDays(viewDate: Date): Date[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - firstWeekday);
  return Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const today = new Date();

  const days = getCalendarDays(open ? viewDate : (selected ?? viewDate));

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setViewDate(selected ?? new Date());
      }}
    >
      <PopoverPrimitive.Trigger
        id={id}
        type="button"
        aria-invalid={props["aria-invalid"]}
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? formatDisplayDate(selected) : placeholder}
        </span>
        <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" sideOffset={4} align="start" className="isolate z-50">
          <PopoverPrimitive.Popup className="w-64 origin-(--transform-origin) rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              >
                <ChevronLeftIcon className="size-4" />
                <span className="sr-only">Mes anterior</span>
              </button>
              <span className="text-sm font-medium">
                {MONTH_NAMES[viewDate.getMonth()]} de {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                <ChevronRightIcon className="size-4" />
                <span className="sr-only">Mes siguiente</span>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {DAY_NAMES.map((day) => (
                <span key={day} className="text-xs font-medium text-muted-foreground">
                  {day}
                </span>
              ))}
              {days.map((day) => {
                const outOfMonth = day.getMonth() !== viewDate.getMonth();
                const isSelected = selected && isSameDay(day, selected);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(toISODate(day));
                      setOpen(false);
                    }}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-sm tabular-nums hover:bg-muted",
                      outOfMonth && "text-muted-foreground/50",
                      isToday && !isSelected && "font-semibold text-primary",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
