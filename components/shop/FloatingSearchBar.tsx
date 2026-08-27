"use client";

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";

export function FloatingSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative mx-4 -mt-8 flex items-center gap-2 rounded-card border border-line bg-surface p-3 shadow-soft-lg sm:mx-auto sm:max-w-2xl"
    >
      <MagnifyingGlass size={20} className="shrink-0 text-ink-500" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={fa.home.heroSearchPlaceholder}
        aria-label={fa.home.heroSearchPlaceholder}
        name="q"
        className="h-11 flex-1 rounded-input bg-transparent text-base text-ink-900 placeholder:text-ink-500"
      />
      <Button type="submit" variant="primary">
        {fa.home.heroSearchButton}
      </Button>
    </form>
  );
}
