import { getContactSetting } from "@/lib/db/settings";
import { WhatsAppFabButton } from "@/components/shop/WhatsAppFabButton";

export async function WhatsAppFab() {
  const contact = await getContactSetting();
  return <WhatsAppFabButton href={`https://wa.me/${contact.whatsapp}`} />;
}
