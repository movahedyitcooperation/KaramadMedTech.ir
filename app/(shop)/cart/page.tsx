import { CartView } from "@/components/shop/CartView";
import { getShippingSetting } from "@/lib/db/settings";
import { fa } from "@/lib/i18n/fa";

export default async function CartPage() {
  const shipping = await getShippingSetting();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-bold text-ink-900">{fa.cart.pageTitle}</h1>
      <CartView shipping={shipping} />
    </div>
  );
}
