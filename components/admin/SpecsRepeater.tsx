"use client";

import { ArrowDown, ArrowUp, Trash } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fa } from "@/lib/i18n/fa";
import type { AdminProductSpec } from "@/lib/types/admin";

export interface SpecsRepeaterProps {
  value: AdminProductSpec[];
  onChange: (specs: AdminProductSpec[]) => void;
}

export function SpecsRepeater({ value, onChange }: SpecsRepeaterProps) {
  function updateAt(index: number, patch: Partial<AdminProductSpec>) {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function addRow() {
    onChange([...value, { group: "", key: "", value: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((spec, i) => (
        <div key={spec.id ?? i} className="flex items-start gap-2">
          <Input
            value={spec.group}
            placeholder={fa.admin.products.specGroupPlaceholder}
            onChange={(e) => updateAt(i, { group: e.target.value })}
            className="flex-1"
          />
          <Input
            value={spec.key}
            placeholder={fa.admin.products.specKeyPlaceholder}
            onChange={(e) => updateAt(i, { key: e.target.value })}
            className="flex-1"
          />
          <Input
            value={spec.value}
            placeholder={fa.admin.products.specValuePlaceholder}
            onChange={(e) => updateAt(i, { value: e.target.value })}
            className="flex-1"
          />
          <div className="flex shrink-0 gap-1 pt-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={fa.admin.upload.moveUp}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-bg disabled:opacity-30"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
              aria-label={fa.admin.upload.moveDown}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-bg disabled:opacity-30"
            >
              <ArrowDown size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={fa.common.remove}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-bg hover:text-danger"
            >
              <Trash size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
        {fa.admin.products.addSpecRow}
      </Button>
    </div>
  );
}
