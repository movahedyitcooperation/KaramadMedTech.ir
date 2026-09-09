import { Footer } from "@/components/shop/Footer";
import { SkipLink } from "@/components/ui/SkipLink";
import { Header } from "@/components/shop/Header";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Organization + WebSite describe the shop itself, so they belong on
       * every storefront route rather than being repeated per page. Page-level
       * Product and BreadcrumbList JSON-LD are emitted by the pages that have
       * something specific to say. */}
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
