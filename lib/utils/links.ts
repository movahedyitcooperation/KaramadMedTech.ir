import { fa } from "@/lib/i18n/fa";
import type { ContactSetting, SocialLinks } from "@/lib/types/settings";

/** `tel:` needs bare digits — the stored value carries dashes for display. */
export function telHref(phone: string): string {
  return `tel:${String(phone ?? "").replace(/[^\d+]/g, "")}`;
}

/** wa.me wants the international number with no punctuation, as stored. */
export function waHref(contact: Pick<ContactSetting, "whatsapp">, text?: string): string {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text ?? fa.wa.presetText)}`;
}

const SOCIAL_BASE: Record<keyof SocialLinks, string> = {
  telegram: "https://t.me/",
  instagram: "https://instagram.com/",
  aparat: "https://aparat.com/",
  youtube: "https://youtube.com/",
};

/**
 * The seeded settings store full URLs for socials, but the schema allows a
 * bare handle too (the design branch's fixture uses handles). Accept both
 * rather than producing "https://t.me/https://t.me/karamadmedtech".
 */
export function socialHref(kind: keyof SocialLinks, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return SOCIAL_BASE[kind] + value;
}
