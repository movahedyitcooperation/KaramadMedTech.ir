import { apiFetch } from "@/lib/api/client";
import { mapSettings } from "@/lib/api/mappers";
import type { ApiSiteSettings } from "@/lib/api/types";
import type { ContactSetting, ShippingSetting, SiteSettings } from "@/lib/types/settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  const raw = await apiFetch<ApiSiteSettings>("/settings/");
  return mapSettings(raw);
}

export async function getShippingSetting(): Promise<ShippingSetting> {
  return (await getSiteSettings()).shipping;
}

export async function getContactSetting(): Promise<ContactSetting> {
  return (await getSiteSettings()).contact;
}
