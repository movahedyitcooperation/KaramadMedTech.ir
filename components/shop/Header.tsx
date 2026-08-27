import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CartDropdown } from "@/components/shop/CartDropdown";
import { HeaderAuthStatus } from "@/components/shop/HeaderAuthStatus";
import { HeaderSearchModal } from "@/components/shop/HeaderSearchModal";
import { MegaMenuNav } from "@/components/shop/MegaMenuNav";
import { MobileNavDrawer } from "@/components/shop/MobileNavDrawer";
import { PhoneWidget } from "@/components/shop/PhoneWidget";
import { getCategoryTree } from "@/lib/db/categories";
import { getContactSetting } from "@/lib/db/settings";

/**
 * CLAUDE.md's own wording puts the cart pill at "top-start" and the login
 * pill at "top-end". Under dir="rtl", logical start is the visual right —
 * so the cart cluster renders first in DOM (-> right) and the
 * search/login cluster last (-> left). This mirrors the iprojector.ir
 * reference screenshots (which show the opposite arrangement), but
 * CLAUDE.md's RTL rules take precedence over pixel-matching the reference.
 * Swap the two grid cells below if pixel parity with the reference is
 * wanted instead.
 */
export async function Header() {
  const [categoryTree, contact] = await Promise.all([getCategoryTree(), getContactSetting()]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 shadow-xs backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <CartDropdown />
          <PhoneWidget phone={contact.phone} />
          <MobileNavDrawer categories={categoryTree} contact={contact} />
        </div>

        <Link href="/" className="min-w-0 max-w-[150px] justify-self-center sm:max-w-none">
          <Logo />
        </Link>

        <div className="flex min-w-0 items-center gap-2 justify-self-end">
          <HeaderSearchModal />
          <HeaderAuthStatus />
        </div>
      </div>
      <div className="hidden border-t border-line lg:block">
        <div className="mx-auto max-w-7xl px-6">
          <MegaMenuNav categories={categoryTree} />
        </div>
      </div>
    </header>
  );
}
