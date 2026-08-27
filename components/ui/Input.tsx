"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={!!error || undefined}
          className={cn(
            "h-11 w-full rounded-input border bg-surface px-4 text-base text-ink-900 outline-none transition-[border-color,box-shadow] duration-(--duration-base) placeholder:text-ink-400 focus:ring-2",
            error
              ? "border-danger bg-danger/5 focus:border-danger focus:ring-danger/20"
              : "border-line-strong focus:border-brand-600 focus:ring-brand-600/20",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
