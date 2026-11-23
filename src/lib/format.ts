// Shared formatting helpers — Indian rupee prices, dates and status labels.

export function inr(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "₹0";
  return "₹" + Number(v).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export const STATUS_LABELS: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_FLOW = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"] as const;

export function sourceLabel(source: string): string {
  if (source === "whatsapp") return "WhatsApp";
  if (source === "manual") return "Manual entry";
  return "Online";
}

export function payLabel(order: { payment_method: string; payment_status: string }): string {
  if (order.payment_method === "razorpay") {
    return order.payment_status === "paid" ? "Paid online (Razorpay)" : `Payment ${order.payment_status}`;
  }
  return "Pay on confirmation (WhatsApp)";
}
