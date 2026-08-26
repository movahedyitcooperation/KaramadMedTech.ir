import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { getContactSetting } from "@/lib/db/settings";

export async function WhatsAppFab() {
  const contact = await getContactSetting();

  return (
    <a
      href={`https://wa.me/${contact.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="گفتگو در واتساپ"
      className="fixed bottom-6 end-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white shadow-soft-lg transition-transform duration-200 hover:scale-105"
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden="true" />
    </a>
  );
}
