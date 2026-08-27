"use client";

import { ArrowCounterClockwise, Trash } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatToman } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useCartStore } from "@/lib/stores/cart-store";
import type { CartLine } from "@/lib/types/cart";
import type { ShippingSetting } from "@/lib/types/settings";

const UNDO_WINDOW_MS = 5000;

export function CartView({ shipping }: { shipping: ShippingSetting }) {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const [pendingRemoval, setPendingRemoval] = useState<CartLine | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onRemove(item: CartLine) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    removeItem(item.productId);
    setPendingRemoval(item);
    undoTimerRef.current = setTimeout(() => setPendingRemoval(null), UNDO_WINDOW_MS);
  }

  function onUndo() {
    if (!pendingRemoval) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    addItem(
      {
        id: pendingRemoval.productId,
        slug: pendingRemoval.slug,
        name: pendingRemoval.name,
        images: [{ url: pendingRemoval.image, alt: pendingRemoval.name, sortOrder: 1 }],
        price: pendingRemoval.unitPrice,
        stock: pendingRemoval.stock,
      },
      pendingRemoval.qty
    );
    setPendingRemoval(null);
  }

  const undoBar = (
    <div aria-live="polite" className="empty:hidden mb-4">
      {pendingRemoval && (
        <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-bg px-4 py-3 text-sm">
          <span className="text-ink-900">{fa.cart.itemRemoved(pendingRemoval.name)}</span>
          <button
            type="button"
            onClick={onUndo}
            className="flex shrink-0 cursor-pointer items-center gap-1 font-medium text-brand-600 hover:underline"
          >
            <ArrowCounterClockwise size={16} aria-hidden="true" />
            {fa.cart.undo}
          </button>
        </div>
      )}
    </div>
  );

  if (items.length === 0) {
    return (
      <div>
        {undoBar}
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line py-20 text-center">
          <p className="text-lg font-bold text-ink-900">{fa.cart.emptyTitle}</p>
          <p className="text-sm text-ink-500">{fa.cart.emptyDesc}</p>
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            {fa.cart.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const shippingCost =
    shipping.mode === "free" || subtotal >= shipping.freeOver ? 0 : shipping.cost;
  const total = subtotal + shippingCost;

  return (
    <div>
      {undoBar}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-soft"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-input bg-brand-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-2"
                  sizes="80px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/product/${item.slug}`}
                    className="min-w-0 truncate text-sm font-medium text-ink-900 hover:text-brand-600"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    aria-label={fa.cart.removeItem}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-bg hover:text-danger"
                  >
                    <Trash size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <QuantityStepper
                    value={item.qty}
                    max={item.stock}
                    onChange={(qty) => updateQty(item.productId, qty)}
                  />
                  <span className="text-sm font-bold tabular-nums text-ink-900">
                    {formatToman(item.unitPrice * item.qty)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-card border border-line bg-surface p-5 shadow-soft lg:sticky lg:top-24">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">{fa.cart.subtotal}</span>
              <span className="font-medium tabular-nums text-ink-900">
                {formatToman(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">{fa.cart.shippingLabel}</span>
              <span className="font-medium tabular-nums text-ink-900">
                {shippingCost === 0 ? fa.cart.freeShipping : formatToman(shippingCost)}
              </span>
            </div>
            {shippingCost > 0 && (
              <p className="text-xs text-ink-500">
                {fa.cart.freeShippingHint(formatToman(shipping.freeOver))}
              </p>
            )}
            <div className="flex items-center justify-between border-t border-line pt-3 text-base font-bold text-ink-900">
              <span>{fa.cart.total}</span>
              <span className="tabular-nums">{formatToman(total)}</span>
            </div>
          </div>
          <Button
            variant="teal"
            size="lg"
            className="mt-4 w-full"
            disabled
            title={fa.cart.checkoutComingSoon}
          >
            {fa.cart.goToCheckout}
          </Button>
        </div>
      </div>
    </div>
  );
}
