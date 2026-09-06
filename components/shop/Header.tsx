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
import { isLoggedIn, readCartCount } from "@/lib/session";

/**
 * Under dir="rtl" logical start is the visual right, so the brand lockup
 * renders first (-> right) and the controls cluster last (-> left).
 *
 * The cart badge reads the `cart_count` cookie rather than fetching the cart:
 * the backend lazily creates a CartSession row for any unseen guest token, so
 * a GET /cart/ on every page load would write a row per anonymous visit.
 * Every cart-mutating Server Action rewrites the cookie and revalidates this
 * layout, so the badge stays correct. (CLAUDE.md §9.)
 *
 * The wide control between the lockup and the cluster is the *finder*
 * affordance, not a search box — it scrolls to the home finder card. The
 * backend has no text-search endpoint, and a text input here would promise
 * one; see HomeFinder for the note that says so out loud.
 */
export async function Header() {
  const [categoryTree, contact, cartCount, loggedIn] = await Promise.all([
    getCategoryTree(),
    getContactSetting(),
    readCartCount(),
    isLoggedIn(),
  ]);

  return (
    <header className="on-emerald sticky top-0 z-40 bg-linear-to-b from-emerald-hi to-emerald to-72% text-bone">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-5 py-4 sm:gap-6 lg:px-8">
        <Link href="/" aria-label={fa.brand.homeAria} className="shrink-0">
          <Logo tone="bone" />
        </Link>

        <Link
          href="/#finder"
          className="j-hdr-finder hidden flex-1 items-center gap-2.5 rounded-pill px-4 py-3 text-start text-15 lg:flex"
        >
          <span aria-hidden="true" className="block size-[15px] shrink-0 rounded-full border-[1.5px]" />
          <span>{fa.header.finder}</span>
        </Link>

        <div className="ms-auto flex shrink-0 items-center gap-2.5">
          <Link
            href="/#finder"
            aria-label={fa.header.finderShort}
            className="j-hdr-ctl grid size-11 place-items-center rounded-4 lg:hidden"
          >
            <span aria-hidden="true" className="block size-4 rounded-full border-[1.5px]" />
          </Link>
          <PhoneWidget phone={contact.phone} />
          <HeaderAuthStatus loggedIn={loggedIn} />
          <CartDropdown count={cartCount} />
          <MobileNavDrawer categories={categoryTree} contact={contact} loggedIn={loggedIn} />
        </div>
      </div>

      <div className="hidden border-t border-bone/12 bg-emerald-deep lg:block">
        <div className="mx-auto max-w-[1280px] px-8">
          <MegaMenuNav categories={categoryTree} />
        </div>
      </div>
    </header>
  );
}
