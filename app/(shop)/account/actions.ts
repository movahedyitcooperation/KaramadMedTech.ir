"use server";

import { revalidatePath } from "next/cache";
import * as accountDb from "@/lib/db/account";
import { parseFaDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { toPersianError } from "@/lib/i18n/errors";

/**
 * Account mutations: the one editable profile field, and address CRUD.
 *
 * Validation is plain runtime checks (no Zod — CLAUDE.md §2), and it exists
 * here only to give a field-level Persian message before a round trip; the
 * backend validates independently and owns ownership checks on every address
 * (a customer must never reach another customer's address by guessing a UUID).
 */

export type ProfileActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function saveProfileNameAction(fullName: string): Promise<ProfileActionResult> {
  try {
    await accountDb.updateProfileName(fullName.trim());
    revalidatePath("/account");
    return { ok: true, message: fa.account.savedNameToast };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export interface AddressFormValues {
  title: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
}

export type AddressActionResult =
  | { ok: true; message: string }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<keyof AddressFormValues, string>> };

const REQUIRED_FIELDS = ["title", "fullName", "phone", "province", "city", "addressLine"] as const;

export async function createAddressAction(values: AddressFormValues): Promise<AddressActionResult> {
  const fieldErrors: Partial<Record<keyof AddressFormValues, string>> = {};
  for (const key of REQUIRED_FIELDS) {
    if (!values[key]?.trim()) fieldErrors[key] = fa.account.addrForm.required;
  }
  // Persian digits are accepted in the form and folded to Latin before both
  // the check and the write — the DB always stores Latin digits.
  const phone = parseFaDigits(values.phone);
  if (!fieldErrors.phone && !/^09\d{9}$/.test(phone)) {
    fieldErrors.phone = fa.account.addrForm.phoneInvalid;
  }
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  try {
    await accountDb.createAddress({
      title: values.title.trim(),
      fullName: values.fullName.trim(),
      phone,
      province: values.province.trim(),
      city: values.city.trim(),
      addressLine: values.addressLine.trim(),
      postalCode: parseFaDigits(values.postalCode),
      isDefault: values.isDefault,
    });
    revalidatePath("/account");
    return { ok: true, message: fa.account.addrForm.savedToast };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export async function setDefaultAddressAction(addressId: string): Promise<AddressActionResult> {
  try {
    await accountDb.setDefaultAddress(addressId);
    revalidatePath("/account");
    return { ok: true, message: fa.account.madeDefaultToast };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}

export async function deleteAddressAction(addressId: string): Promise<AddressActionResult> {
  try {
    await accountDb.deleteAddress(addressId);
    revalidatePath("/account");
    return { ok: true, message: fa.account.removedAddressToast };
  } catch (err) {
    return { ok: false, error: toPersianError(err) };
  }
}
