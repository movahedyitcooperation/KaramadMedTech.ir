"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-ink-900">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            className={cn(
              "h-11 w-full appearance-none rounded-input border border-line bg-surface ps-4 pe-10 text-base text-ink-900 transition-colors duration-200 focus:border-brand-500",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <CaretDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
