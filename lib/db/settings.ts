import { mockSettings } from "@/lib/mock/settings";
import type { ContactSetting, ShippingSetting, SiteSettings } from "@/lib/types/settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  return mockSettings;
}

export async function getShippingSetting(): Promise<ShippingSetting> {
  return mockSettings.shipping;
}

export async function getContactSetting(): Promise<ContactSetting> {
  return mockSettings.contact;
}
