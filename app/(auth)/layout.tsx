import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center bg-bg px-4 py-12">{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
