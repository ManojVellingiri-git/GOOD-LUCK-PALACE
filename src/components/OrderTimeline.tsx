import { CheckCircle2, Circle, Package, ChefHat, Truck, Home, XCircle } from "lucide-react";
import { STATUS_FLOW, STATUS_LABELS, fmtDateTime } from "@/lib/format";
import type { StatusEvent } from "@/lib/types";

const ICONS: Record<string, typeof Circle> = {
  placed: Package,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  out_for_delivery: Truck,
  delivered: Home,
};

// Customer-facing status timeline: Placed → Confirmed → Preparing → Out for Delivery → Delivered.
export default function OrderTimeline({ status, history }: { status: string; history: StatusEvent[] }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-lg border border-[#E7E2DA] bg-white p-4" data-testid="timeline-cancelled">
        <div className="flex items-center gap-2 text-[#B91C1C]">
          <XCircle className="h-5 w-5" />
          <p className="font-heading text-base font-semibold">Order cancelled</p>
        </div>
        {history
          .filter((h) => h.status === "cancelled")
          .map((h, i) => (
            <p key={i} className="mt-1 text-sm text-[#57534E]">{h.note} · {fmtDateTime(h.at)}</p>
          ))}
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  const eventFor = (s: string) => history.filter((h) => h.status === s).slice(-1)[0];

  return (
    <ol className="relative space-y-0" data-testid="order-timeline">
      {STATUS_FLOW.map((s, i) => {
        const Icon = ICONS[s];
        const done = i < currentIndex;
        const current = i === currentIndex;
        const event = eventFor(s);
        return (
          <li key={s} data-testid={`timeline-${s}`} className="relative flex gap-4 pb-8 last:pb-0">
            {i < STATUS_FLOW.length - 1 && (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${done ? "bg-[#15803D]" : "bg-[#E7E2DA]"}`}
                aria-hidden
              />
            )}
            <span
              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                done ? "border-[#15803D] bg-[#15803D] text-white" : current ? "border-[#991B1B] bg-white text-[#991B1B]" : "border-[#E7E2DA] bg-white text-[#D6D3D1]"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className={`text-sm font-semibold ${done || current ? "text-[#1C1917]" : "text-[#A8A29E]"}`}>
                {STATUS_LABELS[s]}
                {current && <span className="ml-2 rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#92400E]">Current</span>}
              </p>
              {event ? (
                <p className="text-xs text-[#57534E]">
                  {event.note ? `${event.note} · ` : ""}
                  {fmtDateTime(event.at)}
                </p>
              ) : (
                <p className="text-xs text-[#A8A29E]">{i <= currentIndex ? "" : "Pending"}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
