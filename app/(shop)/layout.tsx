import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { TrustBadges } from "@/components/shop/TrustBadges";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <TrustBadges />
      <Footer />
      <WhatsAppFab />
    </>
  );
}
