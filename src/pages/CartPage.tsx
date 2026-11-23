import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import QtyStepper from "@/components/QtyStepper";
import Seo from "@/components/Seo";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/useSettings";
import { waCartOrder } from "@/lib/whatsapp";

export default function CartPage() {
  const { items, subtotal, setQty, removeItem } = useCart();
  const { settings } = useSettings();

  const freeAbove = settings.free_delivery_above;
  const estDelivery = subtotal >= freeAbove ? 0 : settings.delivery_fee;
  const estTotal = subtotal + estDelivery;

  if (items.length === 0) {
    return (
      <div className="paper-grain">
        <Seo title="Your Cart | Good Luck Palace Coimbatore" description="Your shopping cart at Good Luck Palace, Coimbatore." />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center" data-testid="cart-empty">
          <h1 className="font-heading text-3xl font-semibold text-[#1C1917]">Your cart is empty</h1>
          <p className="mt-2 text-[#57534E]">Fill it with groceries, beauty picks or a festive hamper.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/groceries" data-testid="cart-empty-shop"><Button className="bg-[#991B1B] text-white hover:bg-[#7F1D1D]">Start shopping</Button></Link>
            <Link to="/hampers" data-testid="cart-empty-hampers"><Button variant="outline">Explore hampers</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-grain">
      <Seo title="Your Cart | Good Luck Palace Coimbatore" description="Your shopping cart at Good Luck Palace, Coimbatore." />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-heading text-3xl font-semibold text-[#1C1917]" data-testid="cart-title">Your Cart</h1>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Line items */}
          <div className="lg:col-span-8" data-testid="cart-items">
            {items.map((i) => (
              <div key={i.product_id} data-testid={`cart-item-${i.product_id}`} className="flex items-center gap-4 border-b border-[#E7E2DA] py-4">
                <img
                  src={i.image_url ?? ""}
                  alt={i.name}
                  className="h-20 w-20 shrink-0 rounded-lg border border-[#E7E2DA] bg-[#F5EFEB] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${i.slug}`} className="line-clamp-1 font-medium text-[#1C1917] hover:text-[#991B1B]">{i.name}</Link>
                  <p className="text-xs text-[#78716C]">{i.brand}{i.unit ? ` · ${i.unit}` : ""}</p>
                  {!i.available && <p className="mt-1 text-xs font-semibold text-[#B91C1C]">Currently unavailable — remove or order on WhatsApp to check</p>}
                  <p className="mt-1 font-mono text-sm font-semibold text-[#1C1917]">{inr(i.price)} × {i.qty} = {inr(i.price * i.qty)}</p>
                </div>
                <QtyStepper value={i.qty} onChange={(n) => setQty(i.product_id, n)} testPrefix={`cart-${i.product_id}`} />
                <Button
                  variant="ghost" size="icon" aria-label={`Remove ${i.name} from cart`}
                  data-testid={`cart-item-remove-${i.product_id}`}
                  onClick={() => removeItem(i.product_id)}
                >
                  <Trash2 className="h-4 w-4 text-[#78716C] hover:text-[#B91C1C]" />
                </Button>
              </div>
            ))}
            <Link to="/groceries" className="mt-4 inline-block text-sm font-medium text-[#991B1B] hover:underline" data-testid="cart-continue-shopping">
              ← Continue shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 rounded-2xl border border-[#E7E2DA] bg-white p-6 shadow-[0_4px_20px_rgba(28,21,18,0.06)]" data-testid="cart-summary">
              <h2 className="font-heading text-xl font-semibold text-[#1C1917]">Order Summary</h2>

              <dl className="mt-4 space-y-2 text-sm" data-testid="cart-totals">
                <div className="flex justify-between"><dt className="text-[#57534E]">Subtotal</dt><dd className="font-mono" data-testid="cart-subtotal">{inr(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#57534E]">Delivery (est.)</dt><dd className="font-mono" data-testid="cart-delivery">{estDelivery === 0 ? "FREE" : inr(estDelivery)}</dd></div>
                <div className="h-px bg-[#E7E2DA]" />
                <div className="flex justify-between text-base font-bold"><dt>Estimated total</dt><dd className="font-mono" data-testid="cart-total">{inr(estTotal)}</dd></div>
              </dl>
              {subtotal < freeAbove && (
                <p className="mt-2 text-xs text-[#78716C]">Add {inr(freeAbove - subtotal)} more for free delivery.</p>
              )}

              <div className="mt-5 space-y-2.5">
                <Link to="/checkout" className="block" data-testid="checkout-button-link">
                  <Button className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D]" data-testid="checkout-button" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <a
                  href={waCartOrder(settings.whatsapp_number, items, estTotal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid="whatsapp-order-link"
                >
                  <Button className="w-full bg-[#22C55E] text-white hover:bg-[#16A34A]" size="lg" data-testid="whatsapp-order-button">
                    <SiWhatsapp className="mr-2 h-4 w-4" /> Place Order on WhatsApp
                  </Button>
                </a>
                <p className="text-center text-[11px] leading-snug text-[#78716C]">
                  WhatsApp orders are confirmed by our staff — availability and delivery charges are confirmed before payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
