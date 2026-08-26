"use client";

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { fa } from "@/lib/i18n/fa";

export function HeaderSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={fa.header.searchOpen}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-900 hover:bg-bg"
      >
        <MagnifyingGlass size={20} aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={fa.header.searchOpen}>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fa.header.searchPlaceholder}
            aria-label={fa.header.searchOpen}
            className="flex-1"
          />
          <Button type="submit" variant="primary">
            {fa.common.search}
          </Button>
        </form>
      </Modal>
    </>
  );
}
