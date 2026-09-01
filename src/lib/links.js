/* links.js — external contact links built from the settings API. */

import fa from "../i18n/fa.js";

export function telHref(phone) {
  return "tel:" + String(phone || "").replace(/[^\d+]/g, "");
}

export function waHref(settings, text) {
  const wa = settings && settings.contact ? settings.contact.whatsapp : "";
  return "https://wa.me/" + wa + "?text=" + encodeURIComponent(text || fa.wa.presetText);
}

export function socialHref(kind, handle) {
  const map = {
    telegram: "https://t.me/",
    instagram: "https://instagram.com/",
    aparat: "https://aparat.com/",
    youtube: "https://youtube.com/",
  };
  return (map[kind] || "https://") + (handle || "");
}
