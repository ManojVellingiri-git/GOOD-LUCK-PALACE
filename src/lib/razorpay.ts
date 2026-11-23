// Razorpay Checkout (test mode) — shared by checkout and "retry payment".
// The gateway order is ALWAYS created server-side; the browser only opens it.
import { apiPost } from "@/lib/api";
import type { RazorpayOrder } from "@/lib/types";

type RazorpayInstance = { open: () => void };

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutJs(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay checkout"));
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export type PayOutcome = "paid" | "dismissed";

/**
 * Create the gateway order for a placed order and open Razorpay Checkout.
 * Resolves "paid" after server-side signature verification succeeds;
 * "dismissed" when the customer closes the window (order stays payable).
 */
export async function payOrder(orderId: string): Promise<PayOutcome> {
  const rp = await apiPost<RazorpayOrder>("/payments/create", { order_id: orderId });
  await loadCheckoutJs();
  if (!window.Razorpay) throw new Error("Razorpay checkout unavailable");

  return new Promise<PayOutcome>((resolve) => {
    const rzp = new window.Razorpay!({
      key: rp.key_id,
      amount: rp.amount,
      currency: rp.currency,
      order_id: rp.razorpay_order_id,
      name: rp.store_name,
      description: `Order ${rp.order_number}`,
      prefill: { name: rp.prefill_name, email: rp.prefill_email, contact: rp.prefill_contact },
      theme: { color: "#991B1B" },
      handler: async (response) => {
        try {
          await apiPost("/payments/verify", {
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve("paid");
        } catch {
          resolve("dismissed"); // verification failed — order stays pending, staff can help
        }
      },
      modal: { ondismiss: () => resolve("dismissed") },
    });
    rzp.open();
  });
}
