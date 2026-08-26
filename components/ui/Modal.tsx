"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-soft-lg",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={fa.common.close}
          className="absolute end-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-bg"
        >
          <X size={20} aria-hidden="true" />
        </button>
        {title && <h2 className="mb-4 pe-10 text-lg font-bold text-ink-900">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
}
