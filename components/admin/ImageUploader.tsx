"use client";

import { ArrowDown, ArrowUp, Trash, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { Input } from "@/components/ui/Input";
import { fa } from "@/lib/i18n/fa";
import type { AdminProductImage } from "@/lib/types/admin";

export interface ImageUploaderProps {
  value: AdminProductImage[];
  onChange: (images: AdminProductImage[]) => void;
  /** Caller resolves to an already browser-ready absolute URL (see
   * app/admin/products/actions.ts's uploadProductImage — it applies
   * resolveImageUrl before returning, so this component never has to know
   * about BACKEND_PUBLIC_ORIGIN). */
  onUpload: (file: File) => Promise<{ ok: true; data: { url: string } } | { ok: false; error: string }>;
}

/**
 * Reordering is up/down buttons, not drag-and-drop — no DnD-reorder library
 * is in package.json and adding one isn't justified for two small lists
 * (images here, specs in SpecsRepeater). Each dropped/selected file uploads
 * immediately; the form's own Save only ever submits already-resolved URLs,
 * never raw File blobs.
 */
export function ImageUploader({ value, onChange, onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    let next = value;
    for (const file of Array.from(files)) {
      const result = await onUpload(file);
      if (result.ok) {
        next = [...next, { url: result.data.url, alt: "" }];
      } else {
        setError(result.error);
      }
    }
    onChange(next);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  }

  function updateAt(index: number, patch: Partial<AdminProductImage>) {
    onChange(value.map((img, i) => (i === index ? { ...img, ...patch } : img)));
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

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-input border border-dashed border-line bg-bg p-6 text-center text-sm text-ink-500 transition-colors duration-200 hover:border-brand-500"
      >
        <UploadSimple size={24} aria-hidden="true" />
        <span>{fa.admin.upload.dropHint}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {uploading && <p className="text-xs text-ink-500">{fa.admin.upload.uploading}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {value.map((img, i) => (
            <li key={img.id ?? img.url} className="flex flex-col gap-2 rounded-input border border-line p-2">
              <div className="relative aspect-square overflow-hidden rounded-input bg-bg">
                <Image src={img.url} alt={img.alt || ""} fill className="object-cover" sizes="200px" />
              </div>
              <Input
                value={img.alt}
                placeholder={fa.admin.upload.altPlaceholder}
                onChange={(e) => updateAt(i, { alt: e.target.value })}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={fa.admin.upload.moveUp}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-bg disabled:opacity-30"
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label={fa.admin.upload.moveDown}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-bg disabled:opacity-30"
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={fa.admin.upload.remove}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-bg hover:text-danger"
                >
                  <Trash size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
