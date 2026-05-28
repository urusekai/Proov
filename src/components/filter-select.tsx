"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex min-w-36 items-center justify-between gap-3 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-text shadow-sm transition-all hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
          open ? "border-accent ring-2 ring-accent/20" : "border-lavender-tint"
        }`}
      >
        <span>{selected.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-text transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-full overflow-hidden rounded-lg border border-lavender-tint bg-white py-1 shadow-highlight"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center whitespace-nowrap px-4 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-accent/10 font-bold text-accent"
                    : "font-medium text-text hover:bg-lavender-tint/30"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
