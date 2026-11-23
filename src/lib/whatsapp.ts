// wa.me deep-link builders — the store's WhatsApp ordering path (no API needed).
import type { CartItem } from "./types";

export function waEnquire(whatsappNumber: string, productName: string, price?: number | null): string {
  const pricePart = price ? ` (₹${price.toLocaleString("en-IN")})` : "";
  const msg = `Hello Good Luck Palace, I am interested in purchasing ${productName}${pricePart}. Could you please share its availability and price?`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

export function waOrderMessage(
  whatsappNumber: string,
  items: CartItem[],
  total: number,
  orderNumber?: string | null,
): string {
  return waCartOrder(whatsappNumber, items, total, orderNumber);
}

export function waCartOrder(
  whatsappNumber: string,
  items: CartItem[],
  total: number,
  orderNumber?: string | null,
): string {
  const lines = items.map((i, idx) => `${idx + 1}. ${i.name} x ${i.qty} - Rs ${i.price * i.qty}`);
  const header = "Hello Good Luck Palace!\n\nI would like to place an order:";
  const orderLine = orderNumber ? ` (Order ${orderNumber})` : "";
  const msg = `${header}${orderLine}\n${lines.join("\n")}\nEstimated Total: Rs ${total}\n\nPlease confirm product availability and delivery charges.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

export function waHello(whatsappNumber: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Good Luck Palace! I have an enquiry.")}`;
}
