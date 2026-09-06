import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { Panel } from "@/components/ui/Panel";
import { fa } from "@/lib/i18n/fa";

export const metadata: Metadata = {
  title: fa.notFound.metaTitle,
  robots: { index: false },
};

/**
 * The site-wide 404 — every URL that matches no route at all.
 *
 * app/(shop)/not-found.tsx does not cover these: a route group's not-found
 * only answers a `notFound()` raised inside that group (an unknown product or
 * category slug). A path with no matching segment resolves above the group, so
 * without this file Next serves its own unstyled English "This page could not
 * be found" — on an entirely Persian, right-to-left site.
 *
 * The chrome is mounted here rather than inherited, for the same reason: this
 * renders under the root layout, outside the shop group, so the Header and
 * Footer have to be named explicitly.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
          <Panel
            title={fa.notFound.title}
            body={fa.notFound.body}
            actions={
              <>
                <Link
                  href="/"
                  className="rounded-4 bg-ink px-6.5 py-3.5 text-[15.5px] font-bold text-surface transition-colors duration-(--duration-state) hover:bg-emerald"
                >
                  {fa.notFound.home}
                </Link>
                <Link
                  href="/search"
                  className="rounded-4 border border-ink/20 px-6.5 py-3.5 text-[15.5px] text-ink transition-colors duration-(--duration-state) hover:bg-page"
                >
                  {fa.notFound.search}
                </Link>
              </>
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
