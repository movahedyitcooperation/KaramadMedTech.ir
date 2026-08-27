"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-ink-900">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={!!error || undefined}
          className={cn(
            "w-full resize-y rounded-input border bg-surface px-4 py-3 text-base text-ink-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20",
            error ? "border-danger" : "border-line",
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
Textarea.displayName = "Textarea";
