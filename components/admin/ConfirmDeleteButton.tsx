"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fa } from "@/lib/i18n/fa";

export interface ConfirmDeleteButtonProps {
  title: string;
  body: string;
  onConfirm: () => Promise<{ ok: true } | { ok: false; error: string }>;
  triggerLabel?: string;
}

export function ConfirmDeleteButton({ title, body, onConfirm, triggerLabel }: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await onConfirm();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-danger hover:bg-danger/10"
      >
        {triggerLabel ?? fa.common.remove}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-ink-900">{body}</p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {fa.admin.common.cancel}
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={handleConfirm}>
            {fa.admin.common.confirmDelete}
          </Button>
        </div>
      </Modal>
    </>
  );
}
