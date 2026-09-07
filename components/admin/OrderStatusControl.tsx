"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderStatus } from "@/app/admin/(protected)/orders/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { fa } from "@/lib/i18n/fa";
import type { OrderStatus } from "@/lib/types/admin";

// Mirrors admin_orders.py's own _ALLOWED_TRANSITIONS exactly — kept here
// rather than derived from the API response so the control can disable
// invalid choices up front instead of only finding out on submit. If the
// backend's table ever changes, this one needs updating too; there's no
// single source of truth to import from across the language boundary.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const router = useRouter();
  const options = ALLOWED_TRANSITIONS[currentStatus];
  const [target, setTarget] = useState<OrderStatus | "">(options[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) {
    return <p className="text-sm text-ink-500">{fa.admin.orders.noFurtherTransitions}</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setError(null);
    setLoading(true);
    const result = await updateOrderStatus(orderId, target);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Select value={target} onChange={(e) => setTarget(e.target.value as OrderStatus)} className="sm:w-56">
        {options.map((s) => (
          <option key={s} value={s}>
            {fa.admin.orders.statusLabels[s] ?? s}
          </option>
        ))}
      </Select>
      <Button type="submit" loading={loading} disabled={!target}>
        {loading ? fa.admin.orders.updating : fa.admin.orders.statusUpdateButton}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger sm:ms-2">
          {error}
        </p>
      )}
    </form>
  );
}
