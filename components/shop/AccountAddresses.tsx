"use client";

import { useState, useTransition } from "react";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  type AddressFormValues,
} from "@/app/(shop)/account/actions";
import { Button } from "@/components/ui/Button";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useToastStore } from "@/lib/stores/toast-store";
import type { Address } from "@/lib/types/account";
import { cn } from "@/lib/utils/cn";

const EMPTY_FORM: AddressFormValues = {
  title: "",
  fullName: "",
  phone: "",
  province: "",
  city: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

type FieldErrors = Partial<Record<keyof AddressFormValues, string>>;

/**
 * Address list plus the add form.
 *
 * Marking one address default is a PATCH with `is_default: true`; the backend
 * clears the flag on every other address of that user in the same
 * transaction, so there is never a moment with two defaults — this component
 * doesn't try to manage that itself.
 *
 * Plain useState per field, submitted through a Server Action: no form
 * library, matching every other form in this codebase (CLAUDE.md §2).
 */
export function AccountAddresses({ addresses }: { addresses: Address[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState<AddressFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pushToast = useToastStore((s) => s.push);

  function set<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createAddressAction(values);
      if (result.ok) {
        pushToast(result.message);
        setValues(EMPTY_FORM);
        setFormOpen(false);
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result.error) setError(result.error);
    });
  }

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      pushToast(result.ok ? (result.message ?? "") : (result.error ?? fa.errors.generic));
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      {addresses.length === 0 && !formOpen && (
        <p className="text-15 leading-[1.9] text-ink/62">{fa.account.addressesEmpty}</p>
      )}

      {addresses.map((address) => (
        <div
          key={address.id}
          className={cn(
            "flex flex-col gap-2.5 rounded-6 border bg-surface p-5.5",
            address.isDefault ? "border-emerald/34" : "border-ink/9"
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <strong className="text-[16.5px] font-bold">{address.title}</strong>
            {address.isDefault && (
              <span className="rounded-2 bg-emerald px-2.5 py-1 text-12 font-bold text-bone">
                {fa.account.defaultBadge}
              </span>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteAddressAction(address.id))}
              className="ms-auto cursor-pointer text-13 text-danger disabled:opacity-50"
            >
              {fa.account.removeAddress}
            </button>
          </div>

          <div className="text-15 leading-[1.9] text-ink/75">
            {address.province}، {address.city}، {address.addressLine}
          </div>

          <div className="text-sm leading-[1.8] text-ink/55">
            {address.fullName} —{" "}
            <span dir="ltr" className="inline-block">
              {toPersianDigits(address.phone)}
            </span>
            {address.postalCode && (
              <>
                {" "}
                — {fa.account.postalLabel}{" "}
                <span dir="ltr" className="inline-block">
                  {toPersianDigits(address.postalCode)}
                </span>
              </>
            )}
          </div>

          {!address.isDefault && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setDefaultAddressAction(address.id))}
              className="cursor-pointer self-start rounded-4 border border-ink/18 px-4 py-2.25 text-13 text-ink transition-colors hover:border-ink disabled:opacity-50"
            >
              {fa.account.makeDefault}
            </button>
          )}
        </div>
      ))}

      {formOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-4 rounded-6 border border-ink/10 bg-surface p-6"
        >
          <Field
            label={fa.account.addrForm.title}
            value={values.title}
            error={fieldErrors.title}
            placeholder={fa.account.addrForm.titlePlaceholder}
            onChange={(v) => set("title", v)}
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label={fa.account.addrForm.fullName}
              value={values.fullName}
              error={fieldErrors.fullName}
              onChange={(v) => set("fullName", v)}
            />
            <Field
              label={fa.account.addrForm.phone}
              value={values.phone}
              error={fieldErrors.phone}
              placeholder={fa.account.addrForm.phonePlaceholder}
              numeric
              ltr
              onChange={(v) => set("phone", v)}
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label={fa.account.addrForm.province}
              value={values.province}
              error={fieldErrors.province}
              onChange={(v) => set("province", v)}
            />
            <Field
              label={fa.account.addrForm.city}
              value={values.city}
              error={fieldErrors.city}
              onChange={(v) => set("city", v)}
            />
          </div>
          <Field
            label={fa.account.addrForm.line}
            value={values.addressLine}
            error={fieldErrors.addressLine}
            placeholder={fa.account.addrForm.linePlaceholder}
            onChange={(v) => set("addressLine", v)}
          />
          <Field
            label={fa.account.addrForm.postal}
            value={values.postalCode}
            error={fieldErrors.postalCode}
            numeric
            ltr
            onChange={(v) => set("postalCode", v)}
          />

          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={values.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="size-4 accent-emerald"
            />
            <span>{fa.account.addrForm.isDefault}</span>
          </label>

          <div aria-live="polite" className="min-h-5 text-13 text-danger">
            {error}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending} className="rounded-4 px-6.5 py-3.25 font-bold">
              {pending ? fa.account.addrForm.saving : fa.account.addrForm.save}
            </Button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setFieldErrors({});
                setError(null);
              }}
              className="cursor-pointer rounded-4 border border-ink/18 px-6 py-3.25 text-15 text-ink transition-colors hover:border-ink"
            >
              {fa.account.addrForm.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="cursor-pointer rounded-6 border border-dashed border-ink/28 p-4.5 text-15 font-semibold text-emerald transition-colors hover:border-ink/50"
        >
          {fa.account.addAddress}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  error,
  placeholder,
  numeric,
  ltr,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  numeric?: boolean;
  ltr?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.75 text-sm text-ink/70">
      {label}
      <input
        type="text"
        inputMode={numeric ? "numeric" : undefined}
        dir={ltr ? "ltr" : "rtl"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-4 border bg-white p-3.25 text-15 text-ink",
          error ? "border-danger" : "border-ink/18"
        )}
      />
      {error && <span className="text-12 text-danger">{error}</span>}
    </label>
  );
}
