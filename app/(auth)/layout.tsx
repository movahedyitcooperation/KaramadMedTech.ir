import { Footer } from "@/components/shop/Footer";
import { SkipLink } from "@/components/ui/SkipLink";
import { Header } from "@/components/shop/Header";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

/**
 * The login screen keeps the full shop chrome — it isn't a separate,
 * stripped-down auth world. Someone who lands here mid-shop can still reach
 * their cart, the phone number and the departments.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
        }}
      />
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
