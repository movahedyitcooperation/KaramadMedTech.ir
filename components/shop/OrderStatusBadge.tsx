import { fa } from "@/lib/i18n/fa";
import type { OrderStatus } from "@/lib/types/order";
import { cn } from "@/lib/utils/cn";

/** Tone per status. An unknown status — one the backend adds later — still
 * renders, in the neutral tone with the `unknown` label, rather than throwing
 * or showing a raw English key. */
const TONES: Record<string, string> = {
  pending_payment: "border-warn-border-soft bg-warn-bg text-warn",
  paid: "border-emerald/30 bg-emerald/10 text-emerald-live-deep",
  processing: "border-emerald/30 bg-emerald/10 text-emerald-live-deep",
  shipped: "border-emerald/30 bg-emerald/10 text-emerald-live-deep",
  delivered: "border-emerald/30 bg-emerald/10 text-emerald-live-deep",
  cancelled: "border-danger/30 bg-danger/8 text-danger",
};

const LABELS = fa.orderStatus as Record<string, string>;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill border px-3.5 py-1.5 text-13 font-bold",
        TONES[status] ?? "border-ink/15 bg-page text-ink/70"
      )}
    >
      {LABELS[status] ?? fa.orderStatus.unknown}
    </span>
  );
}
