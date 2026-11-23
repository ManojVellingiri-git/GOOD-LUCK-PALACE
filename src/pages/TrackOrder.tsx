import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { PackageSearch, FileText, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import OrderTimeline from "@/components/OrderTimeline";
import Seo from "@/components/Seo";
import { apiGet } from "@/lib/api";
import { inr, payLabel } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("number") || searchParams.get("order") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [order, setOrder] = useState<Order | null>(null);

  const track = useMutation({
    mutationFn: () => {
      const cleanNum = orderNumber.trim().toUpperCase();
      let url = `/orders/track/${encodeURIComponent(cleanNum)}`;
      if (phone.trim()) url += `?phone=${encodeURIComponent(phone.trim())}`;
      return apiGet<Order>(url);
    },
    onSuccess: (o) => setOrder(o),
  });

  useEffect(() => {
    if (orderNumber.trim()) {
      track.mutate();
    }
  }, []);

  return (
    <div className="paper-grain min-h-[85vh] py-12">
      <Seo
        title="Track Your Order | Good Luck Palace Coimbatore"
        description="Track your Good Luck Palace order status timeline from Order Placed to Delivered in Coimbatore."
      />
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center gap-3">
          <PackageSearch className="h-8 w-8 text-[#991B1B]" />
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#1C1917]" data-testid="track-title">
              Track Your Order
            </h1>
            <p className="mt-0.5 text-xs text-[#78716C]">Good Luck Palace, Cross Cut Road, Gandhipuram (Est. 1983)</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-[#57534E]">
          Enter your order number (e.g. <code>GLP-2026-1001</code>) to view the live preparation and delivery status.
        </p>

        <form
          className="mt-6 grid gap-4 rounded-2xl border border-[#E7E2DA] bg-white p-6 shadow-[0_4px_20px_rgba(28,21,18,0.06)] sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (orderNumber.trim()) track.mutate();
          }}
          data-testid="track-form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="track-order-number">Order Number *</Label>
            <Input
              id="track-order-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. GLP-2026-1001"
              className="font-mono text-sm uppercase"
              data-testid="track-order-number-input"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-phone">Mobile Number (Optional)</Label>
            <Input
              id="track-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 98422xxxxx"
              data-testid="track-phone-input"
            />
          </div>
          <Button
            type="submit"
            className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] sm:col-span-2"
            disabled={track.isPending}
            data-testid="track-submit"
          >
            {track.isPending ? "Locating order…" : "Track Order Status"}
          </Button>
          {track.isError && (
            <p className="sm:col-span-2 text-xs text-[#B91C1C] text-center" data-testid="track-error">
              No matching order found. Please check your order number or call our store at +91 422 223 6592.
            </p>
          )}
        </form>

        {order && (
          <div className="mt-8 space-y-6" data-testid="track-result">
            {/* Timeline */}
            <div className="rounded-2xl border border-[#E7E2DA] bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E2DA] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-[#1C1917]">{order.order_number}</span>
                    <Badge className={order.source === "whatsapp" ? "bg-[#22C55E] text-white" : "bg-[#4285F4] text-white"}>
                      {order.source.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#78716C] mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs border-[#E7E2DA] flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Download Tax Invoice
                    </Button>
                  </a>
                </div>
              </div>

              <div className="pt-6">
                <OrderTimeline status={order.status} history={order.status_history} />
              </div>
            </div>

            {/* Summary details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E7E2DA] bg-white p-5 text-xs space-y-2">
                <h3 className="font-heading text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#991B1B]" /> Delivery Destination
                </h3>
                <p className="font-bold text-[#1C1917]">{order.customer_name}</p>
                <p className="text-[#57534E] font-mono">{order.phone}</p>
                <p className="text-[#78716C] leading-relaxed">
                  {order.address.line1}, {order.address.city} - {order.address.pincode}
                </p>
                <div className="pt-2 border-t border-[#E7E2DA] flex justify-between text-[#78716C]">
                  <span>Payment:</span>
                  <span className="font-bold uppercase text-[#1C1917]">{order.payment_method} ({order.payment_status})</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#E7E2DA] bg-white p-5 text-xs space-y-2">
                <h3 className="font-heading text-sm font-bold text-[#1C1917]">Order Items ({order.items.length})</h3>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="truncate">{i.name} × {i.qty}</span>
                      <span className="font-mono">{inr(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#E7E2DA] flex justify-between font-bold text-sm text-[#991B1B]">
                  <span>Total Amount:</span>
                  <span className="font-mono">{inr(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
