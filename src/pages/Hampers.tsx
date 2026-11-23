import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/useSettings";
import { waEnquire } from "@/lib/whatsapp";
import type { Product, ProductPage } from "@/lib/types";

const OCCASIONS = ["Diwali", "Weddings & Muhurtham", "Corporate Gifting", "Housewarming", "Birthdays", "Anniversaries"];

export default function Hampers() {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const hampers = useQuery({
    queryKey: ["products", "hampers-page"],
    queryFn: () => apiGet<ProductPage>("/products?category=hampers&limit=60"),
  });

  return (
    <div className="paper-grain">
      <Seo
        title="Festive & Gift Hampers Coimbatore — Diwali, Wedding, Corporate | Good Luck Palace"
        description="Diwali hampers, wedding return gifts, corporate gift boxes and perfume gift sets from Good Luck Palace, Cross Cut Road, Gandhipuram, Coimbatore. Hand-assembled in-store since 1983. Enquire on WhatsApp."
      />

      <section className="bg-heritage py-16 text-center text-[#FAF7F2]">
        <div className="mx-auto max-w-3xl px-4" data-testid="hampers-hero">
          <Gift className="mx-auto h-10 w-10 text-[#FBBF24]" />
          <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">Festive & Gift Hampers</h1>
          <p className="mt-3 text-[#D6D3D1]">
            Hand-assembled in-store with premium dry fruits, perfumes, sweets and keepsakes —
            wrapped the way Coimbatore celebrates. Every hamper can be customised; enquire on WhatsApp.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2" data-testid="hampers-occasions">
          {OCCASIONS.map((o) => (
            <Badge key={o} variant="outline" className="border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-xs text-[#92400E]">{o}</Badge>
          ))}
        </div>

        {hampers.isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#F0EBE2]" />)}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3" data-testid="hampers-grid">
            {(hampers.data?.items ?? []).map((p: Product) => (
              <div key={p.id} data-testid={`hamper-card-${p.slug}`} className="overflow-hidden rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] shadow-[0_4px_20px_rgba(28,21,18,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <img
                  src={p.image_url ?? ""}
                  alt={`${p.name} — festive gift hamper from Good Luck Palace, Coimbatore`}
                  className="aspect-[4/3] w-full bg-white object-cover"
                />
                <div className="p-5">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#B45309]">{p.brand || "GLP Hampers"}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-[#78350F]">{p.name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#92400E]">{p.description}</p>
                  <p className="mt-3 font-mono text-xl font-bold text-[#78350F]" data-testid={`hamper-price-${p.slug}`}>{inr(p.price)} <span className="text-xs font-normal text-[#92400E]">per {p.unit}</span></p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1 bg-[#991B1B] text-white hover:bg-[#7F1D1D]"
                      disabled={!p.available}
                      data-testid={`hamper-add-to-cart-${p.slug}`}
                      onClick={() => { addItem(p); toast.success(`${p.name} added to cart`); }}
                    >
                      Add to Cart
                    </Button>
                    <a href={waEnquire(settings.whatsapp_number, p.name, p.price)} target="_blank" rel="noopener noreferrer" data-testid={`hamper-whatsapp-${p.slug}`}>
                      <Button className="bg-[#22C55E] text-white hover:bg-[#16A34A]">
                        <SiWhatsapp className="mr-2 h-4 w-4" /> Enquire
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-[#57534E]">
          Bulk and custom hampers for offices and weddings — call {settings.phone} or message us on WhatsApp for a quote.
        </p>
      </section>
    </div>
  );
}
