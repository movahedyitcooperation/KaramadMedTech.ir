import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";

/**
 * The login screen keeps the full shop chrome — it isn't a separate,
 * stripped-down auth world. Someone who lands here mid-shop can still reach
 * their cart, the phone number and the departments.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
