import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { getContactSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";
import { waHref } from "@/lib/utils/links";

export async function WhatsAppFab() {
  const contact = await getContactSetting();

  return (
    <a
      href={waHref(contact)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={fa.wa.aria}
      className="km-fab fixed bottom-6 end-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-live-deep text-surface shadow-fab transition-shadow duration-(--duration-state) hover:shadow-fab-lift"
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden="true" />
    </a>
  );
}
