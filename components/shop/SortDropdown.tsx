"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { Select } from "@/components/ui/Select";
import { fa } from "@/lib/i18n/fa";

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("sort", e.target.value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      aria-label={fa.category.sortBy}
      defaultValue={searchParams.get("sort") ?? "newest"}
      onChange={onChange}
      className="w-auto"
    >
      <option value="newest">{fa.category.sortOptions.newest}</option>
      <option value="cheapest">{fa.category.sortOptions.cheapest}</option>
      <option value="expensive">{fa.category.sortOptions.expensive}</option>
      <option value="rating">{fa.category.sortOptions.rating}</option>
    </Select>
  );
}
