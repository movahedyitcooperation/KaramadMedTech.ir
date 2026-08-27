"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable[0] ?? dialogRef.current).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-card bg-surface p-6 shadow-lg focus:outline-none",
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
