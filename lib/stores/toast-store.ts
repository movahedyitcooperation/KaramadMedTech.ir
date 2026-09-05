import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  /** Pass a stable `key` (e.g. "clamp-<productId>") to dedupe a rapid
   * double-click into one toast instead of stacking identical messages. */
  push: (message: string, key?: string) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;
const MAX_STACKED = 3;

/**
 * The only Zustand store this app keeps after the design port (D1/D2 in
 * the porting plan) — cart and auth state moved to the server; toasts are
 * genuinely client-only and fire from several unrelated components
 * (ProductCard, QuantityStepper, CartView, the address form, login),
 * which is exactly the case a store is for instead of threading a context
 * through five subtrees.
 */
export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, key) => {
    const id = key ?? `${Date.now()}-${Math.random()}`;
    if (key && get().toasts.some((t) => t.id === key)) return;
    set((state) => ({ toasts: [...state.toasts, { id, message }].slice(-MAX_STACKED) }));
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
