import { cookies } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CartDropdown } from "@/components/shop/CartDropdown";
import { HeaderAuthStatus } from "@/components/shop/HeaderAuthStatus";
import { MegaMenuNav } from "@/components/shop/MegaMenuNav";
import { MobileNavDrawer } from "@/components/shop/MobileNavDrawer";
import { PhoneWidget } from "@/components/shop/PhoneWidget";
import { getCategoryTree } from "@/lib/db/categories";
import { getContactSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";

/**
 * CLAUDE.md's own wording puts the cart pill at "top-start" and the login
 * pill at "top-end". Under dir="rtl", logical start is the visual right —
 * so the cart cluster renders first in DOM (-> right) and the
 * account/login cluster last (-> left). This mirrors the iprojector.ir
 * reference screenshots (which show the opposite arrangement), but
 * CLAUDE.md's RTL rules take precedence over pixel-matching the reference.
 *
 * cart_count is read here from a cookie, not a live `GET /cart/` fetch —
 * see CLAUDE.md §9: the backend lazily creates a CartSession row for any
 * unseen guest token, so fetching the cart on every ordinary page load
 * would write one row per anonymous visit. Every cart-mutating Server
 * Action (Stage 3) keeps this cookie in sync via revalidatePath.
 *
 * `contact` for HeaderAuthStatus is hardcoded null until Stage 3 wires it
 * to the real customer session (lib/db/account.ts's getCurrentCustomer) —
 * accurate today, since no real customer session exists yet.
 */
export async function Header() {
  const [categoryTree, contact, cookieStore] = await Promise.all([
    getCategoryTree(),
    getContactSetting(),
    cookies(),
  ]);
  const cartCount = Number(cookieStore.get("cart_count")?.value ?? 0);

  return (
    <header className="on-emerald sticky top-0 z-40 bg-linear-to-b from-emerald-hi to-emerald to-72% text-bone">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label={fa.brand.name}>
          <Logo tone="bone" />
        </Link>

        <div className="hidden lg:block">
          <PhoneWidget phone={contact.phone} />
        </div>

        <div className="ms-auto flex items-center gap-2.5">
          <HeaderAuthStatus contact={null} />
          <CartDropdown initialCount={cartCount} />
          <MobileNavDrawer categories={categoryTree} contact={contact} />
        </div>
      </div>

      <div className="hidden border-t border-bone/12 bg-emerald-deep lg:block">
        <div className="mx-auto max-w-7xl px-8">
          <MegaMenuNav categories={categoryTree} />
        </div>
      </div>
    </header>
  );
}
