import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types/cart";
import type { Product } from "@/lib/types/product";

interface CartState {
  items: CartLine[];
  addItem: (
    product: Pick<Product, "id" | "slug" | "name" | "images" | "price" | "stock">,
    qty?: number
  ) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) => {
        const existing = get().items.find((i) => i.productId === product.id);
        const stock = product.stock;
        if (existing) {
          const nextQty = Math.min(stock, existing.qty + qty);
          set({
            items: get().items.map((i) =>
              i.productId === product.id ? { ...i, qty: nextQty, stock } : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0]?.url ?? "",
                unitPrice: product.price,
                qty: Math.min(stock, qty),
                stock,
              },
            ],
          });
        }
      },
      updateQty: (productId, qty) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, qty: Math.min(i.stock, Math.max(1, qty)) } : i
          ),
        });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "karamad-cart" }
  )
);
