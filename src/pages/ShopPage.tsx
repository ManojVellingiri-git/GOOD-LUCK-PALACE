import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  Heart,
  Eye,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
  PackageSearch,
  ArrowUpRight,
  Filter,
  Plus,
  Minus,
} from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import Seo from "@/components/Seo";
import ProductCard from "@/components/ProductCard";
import { apiGet } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { useSettings } from "@/lib/useSettings";
import { waEnquire } from "@/lib/whatsapp";
import { toast } from "sonner";
import type { Product, Category, ProductPage } from "@/lib/types";

// High-level featured collections for department store browsing
const FEATURED_COLLECTIONS = [
  {
    id: "beauty",
    title: "Cosmetics & Beauty",
    desc: "Everyday beauty rituals, kajal, lipsticks & skincare",
    category: "cosmetics",
    image: "/images/legacy/photo-1596462502278-27bfdc403348",
    badge: "Beauty Bar",
  },
  {
    id: "fragrance",
    title: "Perfumes & Fragrances",
    desc: "Signature attars, pure oils, EDPs & body mists",
    category: "perfumes",
    image: "/images/legacy/photo-1547887538-e3a2f32cb1cc",
    badge: "Fine Scents",
  },
  {
    id: "dryfruits",
    title: "Dry Fruits & Nuts",
    desc: "Hand-sorted California almonds, W240 cashews & raisins",
    category: "dry-fruits",
    image: "/images/legacy/dry-fruits.jpg",
    badge: "Grade-A Quality",
  },
  {
    id: "groceries",
    title: "Groceries & Provisions",
    desc: "Aged Basmati, Chakki Atta, pure oils & daily staples",
    category: "groceries",
    image: "/images/legacy/photo-1542838132-92c53300491e",
    badge: "Pantry Staples",
  },
  {
    id: "hampers",
    title: "Festive & Gift Hampers",
    desc: "Handcrafted brass caskets, celebration boxes & dry fruits",
    category: "hampers",
    image: "/images/legacy/photo-1607344645866-009c320b63e0",
    badge: "Gifts Worth Giving",
  },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { settings } = useSettings();
  const carouselRef = useRef<HTMLDivElement>(null);

  // URL / State parameters - Defaulting to "all" so all products show immediately
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "all");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("instock") === "true");
  const [onSaleOnly, setOnSaleOnly] = useState(searchParams.get("sale") === "true");

  // Quick-View modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Sync state cleanly when URL params change
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedBrand(searchParams.get("brand") || "all");
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  // Fetch full category list
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });

  // Fetch catalogue products from real backend
  const { data: productPage, isLoading } = useQuery<ProductPage>({
    queryKey: ["shop-products"],
    queryFn: () => apiGet<ProductPage>("/products?limit=100"),
  });

  const allProducts = useMemo(() => productPage?.items || [], [productPage]);

  // Extract all distinct brands and their counts from real data
  const brandStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      const b = p.brand?.trim();
      if (b) {
        counts[b] = (counts[b] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allProducts]);

  // Extract category counts from real data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return counts;
  }, [allProducts]);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.brand?.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower) ||
          p.category?.toLowerCase().includes(lower) ||
          p.tags?.some((t) => t.toLowerCase().includes(lower))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Brand filter
    if (selectedBrand !== "all") {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // In stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.available);
    }

    // On sale filter
    if (onSaleOnly) {
      result = result.filter((p) => p.mrp && p.mrp > p.price);
    }

    // Price range presets
    if (priceRange === "under-500") {
      result = result.filter((p) => p.price < 500);
    } else if (priceRange === "500-1000") {
      result = result.filter((p) => p.price >= 500 && p.price <= 1000);
    } else if (priceRange === "above-1000") {
      result = result.filter((p) => p.price > 1000);
    }

    // Sorting
    if (sort === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "discount") {
      result.sort((a, b) => {
        const discA = a.mrp && a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
        const discB = b.mrp && b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
        return discB - discA;
      });
    }

    return result;
  }, [allProducts, q, selectedCategory, selectedBrand, inStockOnly, onSaleOnly, priceRange, sort]);

  // Reset filters to show all products
  const resetFilters = () => {
    setQ("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setPriceRange("all");
    setSort("recommended");
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSearchParams({});
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 340;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddQuick = (product: Product, qty: number = 1) => {
    addItem(product, qty);
    toast.success(`Added ${product.name} to basket`, {
      description: "Delivering across Coimbatore with care.",
    });
  };

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedBrand !== "all" ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (q.trim() ? 1 : 0);

  return (
    <div className="bg-[#FAF8F3] min-h-screen pb-24">
      <Seo
        title="Shop All Products — Good Luck Palace Coimbatore"
        description="Explore the complete departmental store catalogue of Good Luck Palace. Groceries, authentic cosmetics, fine perfumes, dry fruits, bags, and luxury hampers on Cross Cut Road, Coimbatore."
      />

      {/* 1. CINEMATIC HERO SECTION (UP TO 1400px WITH BACKGROUND WATERMARK) */}
      <section className="bg-[#25070d] text-[#FAF8F3] pt-14 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-[#C49A50]/25">
        <div
          className="absolute -right-10 -bottom-12 font-serif text-[120px] sm:text-[200px] lg:text-[260px] font-bold text-white/[0.03] select-none pointer-events-none whitespace-nowrap"
          aria-hidden="true"
        >
          GOOD LUCK
        </div>

        <div className="max-w-[1400px] mx-auto relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#E9D98E] uppercase mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">Shop Catalogue</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C49A50]/15 border border-[#C49A50]/30 rounded-xs mb-3 text-[11px] font-mono tracking-[0.2em] text-[#E9D98E] uppercase">
                ✦ EST. 1983 · CROSS CUT ROAD, GANDHIPURAM ✦
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-none">
                Discover Our <em>Collection</em>
              </h1>
              <p className="font-sans text-sm sm:text-base text-[#D4C3B9] mt-4 leading-relaxed">
                From everyday groceries and gourmet dry fruits to authentic cosmetics, fine perfumes
                and thoughtful hampers — explore Coimbatore&apos;s cherished neighbourhood departmental
                store under one roof.
              </p>
            </div>

            {/* Live Store Metrics */}
            <div className="flex items-center gap-5 sm:gap-7 bg-white/5 border border-[#C49A50]/30 rounded-md px-6 py-4 backdrop-blur-xs self-start lg:self-end">
              <div className="text-center">
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#E9D98E]">
                  {allProducts.length}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-white/70 uppercase">
                  Products in Store
                </span>
              </div>
              <div className="w-[1px] h-10 bg-white/15" />
              <div className="text-center">
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#E9D98E]">
                  {brandStats.length}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-white/70 uppercase">
                  Trusted Brands
                </span>
              </div>
              <div className="w-[1px] h-10 bg-white/15" />
              <div className="text-center">
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#E9D98E]">
                  {categories.length}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-white/70 uppercase">
                  Departments
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C49A50]/40 to-transparent" />
        </div>
      </section>

      {/* 2. CATALOGUE INTRODUCTION STATEMENT */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#25070d]">
          &ldquo;Thoughtfully selected. Made for everyday.&rdquo;
        </h2>
        <p className="font-sans text-sm sm:text-base text-[#77716A] max-w-2xl mx-auto mt-2 leading-relaxed">
          Explore collections spanning everyday essentials, beauty, fragrances, accessories and
          thoughtful gifting — backed by four decades of honest pricing and neighbourhood trust.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="h-[1px] w-12 bg-[#C49A50]/50" />
          <i className="text-[#a78b27] font-serif not-italic text-sm">✦</i>
          <span className="h-[1px] w-12 bg-[#C49A50]/50" />
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS COLLECTION CAROUSEL ("Discover the Goodness") */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white border border-[#E8E0D4] rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="font-mono text-xs tracking-widest text-[#a78b27] uppercase">
                ✦ FEATURED PICKS
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#25070d] mt-1">
                Discover the <em>Goodness.</em>
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#77716A] mt-1">
                Thoughtfully selected favourites from across our collections.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                className="w-10 h-10 rounded-full border border-[#E8E0D4] bg-[#FAF8F3] hover:bg-[#8F1D22] hover:text-[#E9D98E] hover:border-[#8F1D22] transition-all flex items-center justify-center text-[#25070d]"
                aria-label="Previous products"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                className="w-10 h-10 rounded-full border border-[#E8E0D4] bg-[#FAF8F3] hover:bg-[#8F1D22] hover:text-[#E9D98E] hover:border-[#8F1D22] transition-all flex items-center justify-center text-[#25070d]"
                aria-label="Next products"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Carousel Track */}
          <div
            ref={carouselRef}
            className="flex gap-5 overflow-x-auto pb-4 scroll-smooth scrollbar-none"
          >
            {allProducts.slice(0, 8).map((p) => {
              const off =
                p.mrp && p.mrp > p.price
                  ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
                  : 0;

              return (
                <div
                  key={p.id}
                  className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] bg-[#FAF8F3] rounded-md border border-[#E8E0D4] overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-[#C49A50] transition-all group flex-shrink-0"
                >
                  <div className="relative aspect-[4/4] overflow-hidden bg-white">
                    <Link to={`/products/${p.slug}`}>
                      <img
                        src={p.image_url || "/images/legacy/dry-fruits.jpg"}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
                      />
                    </Link>
                    {off > 0 && (
                      <span className="absolute top-2 left-2 bg-[#8F1D22] text-[#E9D98E] font-mono text-[9px] font-bold px-2 py-0.5 rounded-xs">
                        {off}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="font-mono text-[10px] tracking-widest text-[#a78b27] uppercase font-semibold">
                        {p.brand || "GLP Select"}
                      </span>
                      <h4 className="font-serif text-sm font-medium text-[#25070d] line-clamp-2 mt-1">
                        <Link to={`/products/${p.slug}`} className="hover:text-[#8F1D22]">
                          {p.name}
                        </Link>
                      </h4>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#E8E0D4] flex items-center justify-between">
                      <span className="font-sans font-bold text-base text-[#25070d]">
                        {inr(p.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddQuick(p, 1)}
                        className="w-8 h-8 rounded-full bg-[#8F1D22] text-[#E9D98E] flex items-center justify-center hover:bg-[#641419] transition-colors"
                        title="Add to Basket"
                      >
                        <ShoppingBag size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. VISUALLY PROMINENT FEATURED COLLECTIONS */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#a78b27] uppercase">
              ✦ STORE DEPARTMENTS
            </span>
            <h3 className="font-serif text-2xl font-medium text-[#25070d] mt-0.5">
              Explore Our Aisle Collections
            </h3>
          </div>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-mono tracking-wider text-[#8F1D22] hover:text-[#C49A50] transition-colors uppercase inline-flex items-center gap-1 font-semibold"
            >
              Show All Products <ArrowUpRight size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {FEATURED_COLLECTIONS.map((col) => {
            const isActive = selectedCategory === col.category;
            return (
              <div
                key={col.id}
                onClick={() => {
                  setSelectedCategory(isActive ? "all" : col.category);
                  setSelectedBrand("all");
                }}
                className={`group cursor-pointer relative rounded-md overflow-hidden border transition-all duration-300 ${
                  isActive
                    ? "border-[#8F1D22] ring-2 ring-[#C49A50] shadow-lg scale-[1.02]"
                    : "border-[#E8E0D4] hover:border-[#C49A50] hover:shadow-md"
                }`}
              >
                <div className="h-52 sm:h-60 w-full overflow-hidden bg-[#25070d]/10 relative">
                  <img
                    src={col.image}
                    alt={col.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#25070d] via-black/40 to-transparent" />

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    <span className="bg-[#8F1D22] text-[#E9D98E] font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-xs shadow-xs">
                      {col.badge}
                    </span>
                    {isActive && (
                      <span className="bg-[#C49A50] text-[#25070d] p-0.5 rounded-full">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="font-serif text-base font-semibold leading-tight flex items-center justify-between">
                      {col.title}
                      <ArrowUpRight
                        size={15}
                        className="text-[#E9D98E] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </h4>
                    <p className="text-[11px] text-[#E8E0D4] line-clamp-1 mt-1 font-sans">
                      {col.desc}
                    </p>
                    <div className="mt-2 h-[1.5px] bg-[#C49A50] w-0 group-hover:w-12 transition-all duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. DEPARTMENT TILES NAVIGATION */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-3.5">
          <span className="font-mono text-xs tracking-widest text-[#a78b27] uppercase">
            ✦ SHOPPING NAVIGATION
          </span>
          <span className="text-xs font-mono text-[#77716A]">
            Showing <strong>{filteredProducts.length}</strong> of {allProducts.length} items
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedBrand("all");
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all border font-semibold ${
              selectedCategory === "all"
                ? "bg-[#8F1D22] text-[#E9D98E] border-[#8F1D22] shadow-sm"
                : "bg-white text-[#292522] border-[#E8E0D4] hover:border-[#C49A50]"
            }`}
          >
            All Departments ({allProducts.length})
          </button>

          {categories.map((c) => {
            const count = categoryCounts[c.slug] || 0;
            const isSelected = selectedCategory === c.slug;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(isSelected ? "all" : c.slug);
                  setSelectedBrand("all");
                }}
                className={`px-4 py-2.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-[#8F1D22] text-[#E9D98E] border-[#8F1D22] shadow-sm font-semibold"
                    : "bg-white text-[#292522] border-[#E8E0D4] hover:border-[#C49A50]"
                }`}
              >
                {c.name} {count > 0 && <span className="opacity-75 font-mono">({count})</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. SHOP YOUR FAVOURITE BRANDS */}
      {brandStats.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-white border border-[#E8E0D4] rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#C49A50]" />
                <h3 className="font-serif text-lg font-medium text-[#25070d]">
                  Shop Your Favourite Brands
                </h3>
              </div>
              {selectedBrand !== "all" && (
                <button
                  onClick={() => setSelectedBrand("all")}
                  className="text-xs font-mono text-[#8F1D22] hover:underline"
                >
                  Show All Brands
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedBrand("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-all ${
                  selectedBrand === "all"
                    ? "bg-[#25070d] text-[#E9D98E]"
                    : "bg-[#FAF8F3] text-[#77716A] hover:bg-[#E8E0D4]"
                }`}
              >
                All Brands ({brandStats.length})
              </button>
              {brandStats.map(([brandName, count]) => {
                const isSelected = selectedBrand === brandName;
                return (
                  <button
                    key={brandName}
                    onClick={() => setSelectedBrand(isSelected ? "all" : brandName)}
                    className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-all border ${
                      isSelected
                        ? "bg-[#8F1D22] text-white border-[#8F1D22] shadow-xs"
                        : "bg-[#FAF8F3] text-[#292522] border-[#E8E0D4] hover:border-[#C49A50]"
                    }`}
                  >
                    {brandName} <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. COMPACT ADVANCED SEARCH & FILTER TOOLBAR */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white border border-[#E8E0D4] rounded-lg p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77716A]"
              />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chocolates, shampoos, perfumes, cosmetics, dry fruits, rice..."
                className="w-full pl-10 pr-9 py-2.5 rounded-md border border-[#E8E0D4] bg-[#FAF8F3] text-sm text-[#292522] placeholder:text-[#77716A] focus:outline-none focus:border-[#C49A50] focus:bg-white transition-all font-sans"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77716A] hover:text-[#292522]"
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-2.5 rounded-md border border-[#E8E0D4] bg-[#FAF8F3] text-xs font-sans text-[#292522] focus:outline-none focus:border-[#C49A50]"
              >
                <option value="all">All Prices</option>
                <option value="under-500">Under ₹500</option>
                <option value="500-1000">₹500 — ₹1,000</option>
                <option value="above-1000">Above ₹1,000</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2.5 rounded-md border border-[#E8E0D4] bg-[#FAF8F3] text-xs font-sans text-[#292522] focus:outline-none focus:border-[#C49A50]"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="discount">Highest Discount</option>
              </select>

              <label className="inline-flex items-center gap-1.5 text-xs font-sans text-[#292522] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[#8F1D22] w-4 h-4 rounded-xs"
                />
                In Stock Only
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-sans text-[#292522] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(e) => setOnSaleOnly(e.target.checked)}
                  className="accent-[#8F1D22] w-4 h-4 rounded-xs"
                />
                On Sale
              </label>
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#E8E0D4]">
              <span className="text-[11px] font-mono text-[#77716A] uppercase tracking-wider">
                Active filters ({activeFilterCount}):
              </span>

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E0D4] text-xs px-2.5 py-1 rounded-full text-[#292522]">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory("all")} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedBrand !== "all" && (
                <span className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E0D4] text-xs px-2.5 py-1 rounded-full text-[#292522]">
                  Brand: {selectedBrand}
                  <button onClick={() => setSelectedBrand("all")} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E0D4] text-xs px-2.5 py-1 rounded-full text-[#292522]">
                  Price: {priceRange}
                  <button onClick={() => setPriceRange("all")} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E0D4] text-xs px-2.5 py-1 rounded-full text-[#292522]">
                  In Stock
                  <button onClick={() => setInStockOnly(false)} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {onSaleOnly && (
                <span className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E0D4] text-xs px-2.5 py-1 rounded-full text-[#292522]">
                  On Sale
                  <button onClick={() => setOnSaleOnly(false)} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              {q.trim() && (
                <span className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E0D4] text-xs px-2.5 py-1 rounded-full text-[#292522]">
                  Search: &ldquo;{q}&rdquo;
                  <button onClick={() => setQ("")} className="hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-xs font-mono text-[#8F1D22] hover:text-[#C49A50] hover:underline ml-2"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 8. MAIN FOUR-COLUMN PRODUCT CATALOGUE GRID */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 py-12">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-md border border-[#E8E0D4] p-4 animate-pulse h-96"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty state */
          <div className="bg-white border border-[#E8E0D4] rounded-lg p-12 text-center my-8 max-w-xl mx-auto shadow-xs">
            <PackageSearch size={48} className="mx-auto text-[#C49A50] mb-3" />
            <h3 className="font-serif text-2xl font-medium text-[#25070d]">
              No Products Match Your Selection
            </h3>
            <p className="font-sans text-sm text-[#77716A] mt-2 mb-6">
              We couldn&apos;t find any items matching your active search or filters. Reset filters to
              view the full catalogue of {allProducts.length} store items.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 bg-[#8F1D22] text-[#E9D98E] px-6 py-2.5 rounded-md text-xs font-mono tracking-wider uppercase hover:bg-[#641419] transition-colors"
            >
              <RotateCcw size={14} /> View All {allProducts.length} Products
            </button>
          </div>
        ) : (
          /* High-Impact Responsive Products Grid (4 cols desktop, 3 cols tablet, 2 cols mobile) */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => {
                  setQuickViewProduct(prod);
                  setQuickViewQty(1);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 9. PREMIUM EDITORIAL PRODUCT BANNER ("Good choices. Everyday goodness.") */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-[#25070d] text-white rounded-lg p-8 sm:p-12 relative overflow-hidden border border-[#C49A50]/40 shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="font-mono text-xs tracking-widest text-[#E9D98E] uppercase">
              ✦ A GOOD LUCK PALACE COMMITMENT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium mt-2 leading-tight">
              Good choices. <em>Everyday goodness.</em>
            </h2>
            <p className="font-sans text-sm text-[#D4C3B9] mt-3 leading-relaxed">
              Explore thoughtfully selected essentials, personal favourites and meaningful finds.
              Every staple on our shelves is chosen with generational care, honest pricing, and
              neighbourhood trust on Cross Cut Road.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <a
                href={waEnquire(
                  settings.whatsapp_number,
                  "Custom Departmental Inquiry / Home Delivery",
                  null
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#C49A50] text-[#25070d] font-mono text-xs tracking-wider uppercase px-5 py-3 rounded-md font-bold hover:bg-[#E9D98E] transition-colors"
              >
                Chat with Counter on WhatsApp <SiWhatsapp size={16} />
              </a>
              <Link
                to="/hampers"
                className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-[#E9D98E] hover:text-white uppercase py-3 transition-colors"
              >
                Explore Gift Hampers <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. INTERACTIVE QUICK-VIEW MODAL */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setQuickViewProduct(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl border border-[#C49A50]/40 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E8E0D4] flex items-center justify-center text-[#77716A] hover:text-[#25070d] hover:bg-white shadow-xs"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              {/* Product Photograph */}
              <div className="aspect-square bg-[#FAF8F3] relative overflow-hidden">
                <img
                  src={quickViewProduct.image_url || "/images/legacy/dry-fruits.jpg"}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
                {quickViewProduct.mrp && quickViewProduct.mrp > quickViewProduct.price && (
                  <span className="absolute top-3 left-3 bg-[#8F1D22] text-[#E9D98E] text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-xs">
                    {Math.round(
                      ((quickViewProduct.mrp - quickViewProduct.price) / quickViewProduct.mrp) * 100
                    )}
                    % OFF
                  </span>
                )}
              </div>

              {/* Product Information */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono tracking-widest text-[#a78b27] uppercase font-semibold">
                    {quickViewProduct.brand || "GLP Select"}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#25070d] mt-1 leading-snug">
                    {quickViewProduct.name}
                  </h3>

                  {quickViewProduct.unit && (
                    <p className="text-xs font-mono text-[#77716A] mt-1">
                      Pack size: {quickViewProduct.unit}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2 mt-3 pb-3 border-b border-[#E8E0D4]">
                    <span className="font-sans text-2xl font-bold text-[#25070d]">
                      {inr(quickViewProduct.price)}
                    </span>
                    {quickViewProduct.mrp && quickViewProduct.mrp > quickViewProduct.price && (
                      <span className="text-sm text-[#77716A] line-through">
                        {inr(quickViewProduct.mrp)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-sans text-[#665e59] mt-3 line-clamp-3 leading-relaxed">
                    {quickViewProduct.description ||
                      "Handcrafted and curated for quality by Good Luck Palace on Cross Cut Road, Coimbatore."}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-[#E8E0D4]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-[#77716A] uppercase">Quantity:</span>
                    <div className="inline-flex items-center border border-[#E8E0D4] rounded-md">
                      <button
                        onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                        className="px-2.5 py-1 text-[#77716A] hover:text-[#25070d]"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 py-1 text-xs font-mono font-bold">
                        {quickViewQty}
                      </span>
                      <button
                        onClick={() => setQuickViewQty(quickViewQty + 1)}
                        className="px-2.5 py-1 text-[#77716A] hover:text-[#25070d]"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleAddQuick(quickViewProduct, quickViewQty);
                        setQuickViewProduct(null);
                      }}
                      className="flex-1 bg-[#8F1D22] text-[#E9D98E] font-mono text-xs tracking-wider uppercase py-3 rounded-md font-bold hover:bg-[#641419] transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={15} /> Add to Basket
                    </button>
                    <Link
                      to={`/products/${quickViewProduct.slug}`}
                      className="px-3.5 py-3 border border-[#E8E0D4] rounded-md text-xs font-mono text-[#25070d] hover:border-[#C49A50] transition-colors"
                      title="View full product page"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
