import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { getContactSetting } from "@/lib/db/settings";

export async function WhatsAppFab() {
  const contact = await getContactSetting();

  return (
    <a
      href={`https://wa.me/${contact.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      // aria-label is hardcoded here, matching pre-existing behavior — see
      // Footer.tsx's note; the fa.ts sweep is Stage 7 scope.
      aria-label="گفتگو در واتساپ"
      className="km-fab fixed bottom-6 end-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-live-deep text-surface shadow-fab transition-shadow duration-(--duration-state) hover:shadow-fab-lift"
    >
      <WhatsappLogo size={28} weight="fill" aria-hidden="true" />
    </a>
  );
}
