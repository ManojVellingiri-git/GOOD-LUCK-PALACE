import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Heart,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import QtyStepper from "@/components/QtyStepper";
import Seo from "@/components/Seo";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/useSettings";
import { waEnquire } from "@/lib/whatsapp";
import type { Product, ProductPage } from "@/lib/types";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><rect width='600' height='600' fill='#F7F4EE'/><text x='50%' y='46%' font-family='serif' font-size='28' font-weight='600' fill='#25070D' text-anchor='middle'>Good Luck Palace</text><text x='50%' y='52%' font-family='sans-serif' font-size='14' fill='#77716A' letter-spacing='3' text-anchor='middle'>EST. 1983 · COIMBATORE</text><circle cx='300' cy='300' r='200' stroke='#C49A50' stroke-width='2' fill='none' stroke-dasharray='6,6'/></svg>`
  );

export default function ProductDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [imgZoom, setImgZoom] = useState(false);

  // Wishlist state backed by localStorage
  const [isWishlisted, setIsWishlisted] = useState(() => {
    try {
      const saved = localStorage.getItem("glp-wishlist");
      return saved ? JSON.parse(saved).includes(slug) : false;
    } catch {
      return false;
    }
  });

  const q = useQuery({
    queryKey: ["product", slug],
    queryFn: () => apiGet<Product>(`/products/${slug}`),
    retry: false,
  });

  const related = useQuery({
    queryKey: ["products", "related", q.data?.category],
    queryFn: () => apiGet<ProductPage>(`/products?category=${q.data!.category}&limit=8`),
    enabled: !!q.data,
  });

  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-lg bg-[#E8E0D4]" />
          <div className="space-y-6">
            <div className="h-6 w-32 animate-pulse rounded bg-[#E8E0D4]" />
            <div className="h-12 w-3/4 animate-pulse rounded bg-[#E8E0D4]" />
            <div className="h-8 w-44 animate-pulse rounded bg-[#E8E0D4]" />
            <div className="h-32 w-full animate-pulse rounded bg-[#E8E0D4]" />
          </div>
        </div>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center" data-testid="product-not-found">
        <Seo title="Product not found | Good Luck Palace" description="This product could not be found." />
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#25070d]">
          We Couldn&apos;t Find That Product
        </h1>
        <p className="mt-3 text-[#77716A]">It may have moved or been updated. Explore our collection instead.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 bg-[#8F1D22] text-[#E9D98E] px-6 py-3 rounded-md font-mono text-xs tracking-wider uppercase font-bold hover:bg-[#641419] transition-colors"
          data-testid="product-not-found-browse"
        >
          Browse All Products <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  const p = q.data;
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const savings = p.mrp && p.mrp > p.price ? p.mrp - p.price : 0;

  const handleToggleWishlist = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("glp-wishlist") || "[]");
      let next: string[];
      if (saved.includes(p.id)) {
        next = saved.filter((id) => id !== p.id);
        setIsWishlisted(false);
        toast.info(`Removed ${p.name} from wishlist`);
      } else {
        next = [...saved, p.id];
        setIsWishlisted(true);
        toast.success(`Saved ${p.name} to wishlist`);
      }
      localStorage.setItem("glp-wishlist", JSON.stringify(next));
    } catch {
      setIsWishlisted(!isWishlisted);
    }
  };

  const handleAddToCart = () => {
    addItem(p, qty);
    toast.success(`Added ${qty} × ${p.name} to basket`, {
      description: "Delivering across Coimbatore with care.",
    });
  };

  const handleBuyNow = () => {
    addItem(p, qty);
    navigate("/checkout");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${p.name} | Good Luck Palace`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  return (
    <div className="bg-[#FAF8F3] min-h-screen pb-24">
      <Seo
        title={`${p.name}${p.brand ? ` — ${p.brand}` : ""} | Good Luck Palace Coimbatore`}
        description={`Buy ${p.name} (${p.unit}) at ${inr(p.price)} from Good Luck Palace, Cross Cut Road, Gandhipuram, Coimbatore. ${p.description}`}
      />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-1.5 text-xs font-mono tracking-wider text-[#77716A] uppercase mb-8"
          aria-label="Breadcrumb"
          data-testid="product-breadcrumbs"
        >
          <Link to="/" className="hover:text-[#8F1D22] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-[#C49A50]" />
          <Link to="/shop" className="hover:text-[#8F1D22] transition-colors">
            Shop All
          </Link>
          <ChevronRight className="h-3 w-3 text-[#C49A50]" />
          <Link to={`/category/${p.category}`} className="capitalize hover:text-[#8F1D22] transition-colors">
            {p.category.replace("-", " ")}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#C49A50]" />
          <span className="truncate text-[#25070d] font-bold max-w-xs">{p.name}</span>
        </nav>

        {/* Main 2-Column Luxury Presentation */}
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Left: Product Gallery */}
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-lg border border-[#E8E0D4] bg-white shadow-md group cursor-zoom-in"
              onClick={() => setImgZoom(!imgZoom)}
              data-testid="product-image-panel"
            >
              <img
                src={p.image_url || PLACEHOLDER}
                alt={`${p.name}${p.brand ? ` — ${p.brand}` : ""} at Good Luck Palace, Coimbatore`}
                className={`aspect-[4/5] w-full object-cover transition-transform duration-700 ${
                  imgZoom ? "scale-125" : "group-hover:scale-105"
                }`}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                {off > 0 && (
                  <span className="bg-[#8F1D22] text-[#E9D98E] text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-xs shadow-md">
                    {off}% OFF
                  </span>
                )}
                {p.is_hamper && (
                  <span className="bg-[#C49A50] text-[#25070d] text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-xs shadow-md">
                    ✦ Festive Casket
                  </span>
                )}
              </div>

              {/* Wishlist & Share buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWishlist();
                  }}
                  className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs shadow-md flex items-center justify-center transition-all ${
                    isWishlisted ? "text-[#8F1D22] fill-[#8F1D22]" : "text-[#77716A] hover:text-[#8F1D22]"
                  }`}
                  title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <Heart size={18} className={isWishlisted ? "fill-[#8F1D22]" : ""} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs shadow-md flex items-center justify-center text-[#77716A] hover:text-[#25070d] transition-all"
                  title="Share product link"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Stock Overlay */}
              {!p.available && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="rounded bg-[#292522] px-4 py-2 text-sm font-semibold text-white uppercase tracking-wider">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-md border-2 border-[#8F1D22] overflow-hidden bg-white shadow-xs">
                <img
                  src={p.image_url || PLACEHOLDER}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right: Product Info & Purchasing */}
          <div className="bg-white rounded-lg border border-[#E8E0D4] p-6 sm:p-8 shadow-xs" data-testid="product-info-panel">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#a78b27] uppercase font-bold mb-2">
              ✦ {p.brand || "GLP Select"} · EST. 1983
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-medium leading-tight text-[#25070d]">
              {p.name}
            </h1>

            {/* Price Box */}
            <div className="mt-4 p-4 rounded-md bg-[#FAF8F3] border border-[#E8E0D4]/70 flex items-baseline justify-between flex-wrap gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-3xl sm:text-4xl font-bold text-[#25070d]" data-testid="pd-price">
                  {inr(p.price)}
                </span>
                {off > 0 && p.mrp && (
                  <span className="text-base text-[#77716A] line-through font-sans">
                    {inr(p.mrp)}
                  </span>
                )}
                {savings > 0 && (
                  <span className="text-xs font-mono font-bold text-[#15803D]">
                    Save {inr(savings)}
                  </span>
                )}
              </div>
              {p.unit && (
                <span className="text-xs font-mono uppercase tracking-wider text-[#77716A] bg-white px-2.5 py-1 rounded-xs border border-[#E8E0D4]">
                  Unit: {p.unit}
                </span>
              )}
            </div>

            {/* Stock Availability */}
            <div className="mt-4 flex items-center gap-2" data-testid="pd-availability">
              {p.available ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#15803D] bg-[#15803D]/10 px-3 py-1 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                  In Stock — Hand-Packed on Cross Cut Road
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-red-600 bg-red-50 px-3 py-1 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Currently Out of Stock
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-6 pt-5 border-t border-[#E8E0D4]">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#77716A] mb-2 font-bold">
                About This Selection
              </h4>
              <p className="font-sans text-sm sm:text-base leading-relaxed text-[#57534E]" data-testid="pd-description">
                {p.description ||
                  "Carefully selected and sourced directly for Good Luck Palace customers, bringing four decades of quality and trusted standards to your household."}
              </p>
            </div>

            {/* Tags */}
            {p.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5" data-testid="pd-tags">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono uppercase tracking-wider text-[#77716A] bg-[#FAF8F3] px-2.5 py-1 rounded-xs border border-[#E8E0D4]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity Stepper & CTAs */}
            <div className="mt-8 pt-6 border-t border-[#E8E0D4]" data-testid="pd-actions">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#77716A] uppercase font-bold">Qty:</span>
                  <QtyStepper value={qty} onChange={setQty} testPrefix="pd" />
                </div>

                <button
                  type="button"
                  disabled={!p.available}
                  onClick={handleAddToCart}
                  data-testid="pd-add-to-cart"
                  className="flex-1 bg-[#8F1D22] text-[#E9D98E] font-mono text-xs tracking-wider uppercase py-3.5 px-6 rounded-md font-bold hover:bg-[#641419] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-40"
                >
                  <ShoppingBag size={16} /> Add to Basket
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  disabled={!p.available}
                  onClick={handleBuyNow}
                  data-testid="pd-buy-now"
                  className="border border-[#8F1D22] text-[#8F1D22] font-mono text-xs tracking-wider uppercase py-3 px-4 rounded-md font-bold hover:bg-[#8F1D22] hover:text-[#E9D98E] transition-all flex items-center justify-center disabled:opacity-40"
                >
                  Instant Checkout
                </button>

                <a
                  href={waEnquire(settings.whatsapp_number, p.name, p.price)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="pd-whatsapp"
                  className="bg-[#25D366] text-white font-mono text-xs tracking-wider uppercase py-3 px-4 rounded-md font-bold hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <SiWhatsapp size={16} /> Order on WhatsApp
                </a>
              </div>
            </div>

            {/* Service & Delivery Guarantees */}
            <div className="mt-8 pt-6 border-t border-[#E8E0D4] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Truck size={18} className="text-[#C49A50] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-serif text-sm font-semibold text-[#25070d]">Doorstep Delivery</h5>
                  <p className="text-xs text-[#77716A]">Same-day & 24h delivery across Coimbatore city limits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#C49A50] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-serif text-sm font-semibold text-[#25070d]">40+ Years of Trust</h5>
                  <p className="text-xs text-[#77716A]">100% genuine counter products from Gandhipuram.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products from This Aisle */}
        {related.data && related.data.items.length > 1 && (
          <section className="mt-20 pt-12 border-t border-[#E8E0D4]" data-testid="related-products">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="font-mono text-xs tracking-widest text-[#a78b27] uppercase font-bold">
                  ✦ SIMILAR SELECTIONS
                </span>
                <h2 className="font-serif text-3xl font-medium text-[#25070d] mt-1">
                  More from this department
                </h2>
              </div>
              <Link
                to={`/category/${p.category}`}
                className="text-xs font-mono tracking-wider text-[#8F1D22] hover:text-[#C49A50] transition-colors uppercase inline-flex items-center gap-1 font-bold"
              >
                View Department <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {related.data.items
                .filter((r) => r.id !== p.id)
                .slice(0, 4)
                .map((r) => (
                  <ProductCard key={r.id} product={r} />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
