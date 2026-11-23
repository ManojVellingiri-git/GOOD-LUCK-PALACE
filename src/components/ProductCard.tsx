import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { useSettings } from "@/lib/useSettings";
import { waEnquire } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='#F7F4EE'/><text x='50%' y='46%' font-family='serif' font-size='22' font-weight='600' fill='#25070D' text-anchor='middle'>Good Luck Palace</text><text x='50%' y='52%' font-family='sans-serif' font-size='12' fill='#77716A' letter-spacing='2' text-anchor='middle'>EST. 1983 · COIMBATORE</text><circle cx='200' cy='250' r='140' stroke='#C49A50' stroke-width='1.5' fill='none' stroke-dasharray='4,4'/></svg>`
  );

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const [imgError, setImgError] = useState(false);

  // Wishlist state backed by localStorage
  const [isWishlisted, setIsWishlisted] = useState(() => {
    try {
      const saved = localStorage.getItem("glp-wishlist");
      return saved ? JSON.parse(saved).includes(product.id) : false;
    } catch {
      return false;
    }
  });

  const off =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const isBestseller = product.tags?.some((t) => t.toLowerCase().includes("bestseller"));
  const isFestive = product.is_hamper || product.tags?.some((t) => t.toLowerCase().includes("festive"));

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success(`Added ${product.name} to basket`, {
      description: "Delivering across Coimbatore with care.",
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("glp-wishlist") || "[]");
      let next: string[];
      if (saved.includes(product.id)) {
        next = saved.filter((id) => id !== product.id);
        setIsWishlisted(false);
        toast.info(`Removed ${product.name} from wishlist`);
      } else {
        next = [...saved, product.id];
        setIsWishlisted(true);
        toast.success(`Saved ${product.name} to wishlist`);
      }
      localStorage.setItem("glp-wishlist", JSON.stringify(next));
    } catch {
      setIsWishlisted(!isWishlisted);
    }
  };

  return (
    <div
      data-testid={`product-card-${product.slug}`}
      className="group bg-white rounded-md border border-[#E8E0D4] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-[#C49A50] transition-all duration-300 relative"
    >
      {/* Photograph Container */}
      <div className="relative block aspect-[4/5] bg-[#FAF8F3] overflow-hidden">
        <Link to={`/products/${product.slug}`} data-testid={`product-link-${product.slug}`} className="block w-full h-full">
          <img
            src={product.image_url && !imgError ? product.image_url : PLACEHOLDER}
            onError={() => setImgError(true)}
            alt={`${product.name}${product.brand ? ` — ${product.brand}` : ""} at Good Luck Palace, Coimbatore`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-106"
          />
        </Link>

        {/* Dynamic Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {off > 0 && (
            <span className="bg-[#8F1D22] text-[#E9D98E] text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
              {off}% OFF
            </span>
          )}
          {isBestseller && (
            <span className="bg-[#25070D] text-[#E9D98E] text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-xs shadow-xs">
              ★ Bestseller
            </span>
          )}
          {isFestive && (
            <span className="bg-[#C49A50] text-[#25070D] text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs shadow-xs">
              ✦ Festive Edit
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {!product.available && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20" data-testid={`out-of-stock-${product.slug}`}>
            <span className="rounded bg-[#292522] px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Floating Quick Actions (Desktop hover, mobile static) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-all ${
              isWishlisted
                ? "text-[#8F1D22] fill-[#8F1D22]"
                : "text-[#77716A] hover:text-[#8F1D22]"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            aria-label="Wishlist toggle"
          >
            <Heart size={15} className={isWishlisted ? "fill-[#8F1D22]" : ""} />
          </button>

          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-[#77716A] hover:text-[#25070D] hover:bg-[#FAF8F3] transition-all"
              title="Quick View Details"
              aria-label="Quick view"
            >
              <Eye size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Body Information */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#a78b27] uppercase font-semibold">
              {product.brand || "GLP Select"}
            </span>
            <span className="text-[9px] font-mono text-[#77716A] uppercase bg-[#FAF8F3] px-1.5 py-0.5 rounded-xs border border-[#E8E0D4]">
              {product.category}
            </span>
          </div>

          <h3 className="font-serif text-[16px] font-medium text-[#25070d] leading-snug mt-1.5 line-clamp-2">
            <Link to={`/products/${product.slug}`} className="hover:text-[#8F1D22] transition-colors">
              {product.name}
            </Link>
          </h3>

          {product.unit && (
            <p className="text-xs text-[#77716A] font-sans mt-1">{product.unit}</p>
          )}
        </div>

        {/* Pricing & Shopping Controls */}
        <div className="mt-4 pt-3.5 border-t border-[#E8E0D4] flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-lg sm:text-xl font-bold text-[#25070d]">
                {inr(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-[#77716A] line-through">
                  {inr(product.mrp)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={waEnquire(settings.whatsapp_number, product.name, product.price)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Order ${product.name} on WhatsApp`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              title="Enquire on WhatsApp"
            >
              <SiWhatsapp size={14} />
            </a>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!product.available}
              aria-label={`Add ${product.name} to basket`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8F1D22] text-[#E9D98E] hover:bg-[#641419] hover:scale-105 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none"
              title="Add to Basket"
            >
              <ShoppingBag size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
