/**
 * Order statuses the backend can set today. `pending_payment` on creation,
 * `paid` once the gateway callback verifies server-side. Anything else the
 * backend adds later (shipped, cancelled…) still renders — see
 * lib/i18n/fa.ts's orderStatus map and its fallback.
 */
export type OrderStatus = "pending_payment" | "paid" | (string & {});

export interface OrderItem {
  productId: string | null;
  productName: string;
  productSku: string;
  unitPrice: number;
  qty: number;
}

/**
 * An order is a snapshot, not a view onto live data: the delivery address and
 * each line's name, SKU and price are copied at checkout, so editing a
 * product or changing its price never rewrites what someone already bought.
 */
export interface Order {
  id: string;
  orderNumber: string;
  address: {
    title: string;
    fullName: string;
    phone: string;
    province: string;
    city: string;
    line: string;
    postalCode: string | null;
  };
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  // No date: OrderRead does not expose the model's created_at. The order
  // number is the only ordering cue the UI has, and the backend already
  // returns newest-first. Worth asking the backend for created_at — an
  // order history without dates is hard to scan.
  items: OrderItem[];
}

export interface OrderListResult {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}
