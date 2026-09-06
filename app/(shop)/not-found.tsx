import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { fa } from "@/lib/i18n/fa";

/**
 * Shown when `notFound()` fires inside the shop — a product slug or category
 * slug that the API returned 404 for. Keeps the shop chrome so the visitor is
 * one click from a real department rather than stranded on a bare 404.
 */
export default function ShopNotFound() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
      <Panel
        title={fa.pdp.notFound}
        body={fa.category.notFound}
        actions={
          <Link
            href="/"
            className="rounded-4 bg-ink px-6 py-3.5 text-15 font-semibold text-surface transition-colors duration-(--duration-state) hover:bg-emerald"
          >
            {fa.account.ordersEmptyCta}
          </Link>
        }
      />
    </div>
  );
}
