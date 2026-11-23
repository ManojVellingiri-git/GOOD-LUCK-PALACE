import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  Award,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  Send,
} from "lucide-react";
import Seo from "@/components/Seo";
import { useCart } from "@/lib/cart";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

const categories = [
  {
    num: "01",
    title: "Groceries & Provisions",
    sub: "Everyday essentials, thoughtfully selected.",
    image: "/images/legacy/photo-1542838132-92c53300491e",
    path: "/groceries",
    className: "cat-heroic-1",
  },
  {
    num: "02",
    title: "Cosmetics & Beauty",
    sub: "Everyday beauty and personal care.",
    image: "/images/legacy/photo-1596462502278-27bfdc403348",
    path: "/cosmetics",
    className: "cat-heroic-2",
  },
  {
    num: "03",
    title: "Dry Fruits & Nuts",
    sub: "Goodness in every handful.",
    image: "/images/legacy/dry-fruits.jpg",
    path: "/dry-fruits",
    className: "cat-standard",
  },
  {
    num: "04",
    title: "Perfumes & Fragrances",
    sub: "Discover scents for every occasion.",
    image: "/images/legacy/photo-1547887538-e3a2f32cb1cc",
    path: "/perfumes",
    className: "cat-standard",
  },
  {
    num: "05",
    title: "Bags & Accessories",
    sub: "Everyday style, thoughtfully chosen.",
    image: "/images/legacy/photo-1553062407-98eeb64c6a62",
    path: "/accessories",
    className: "cat-standard",
  },
  {
    num: "06",
    title: "Festive & Gift Hampers",
    sub: "Thoughtful gifting for meaningful moments.",
    image: "/images/legacy/photo-1607344645866-009c320b63e0",
    path: "/hampers",
    className: "cat-banner",
  },
];

const picks = [
  [
    "The Everyday Edit",
    "Thoughtful essentials for everyday living.",
    "/images/legacy/photo-1556742049-0cfed4f6a45d",
    "01",
    {
      id: "prod-groc-1",
      slug: "aged-basmati-rice-5kg",
      name: "Royal Aged Basmati Rice (5kg)",
      brand: "Daawat Select",
      description: "Extra long aged grains with signature aroma.",
      category: "groceries",
      price: 650,
      mrp: 750,
      unit: "5 kg",
      image_url: "/images/legacy/photo-1556742049-0cfed4f6a45d",
      available: true,
      is_hamper: false,
      tags: ["bestseller"],
      created_at: new Date().toISOString(),
    },
  ],
  [
    "The Personal Care Edit",
    "Everyday care, carefully considered.",
    "/images/legacy/photo-1608248543803-ba4f8c70ae0b",
    "02",
    {
      id: "prod-cosm-1",
      slug: "mysore-sandal-gold-luxury-pack",
      name: "Mysore Sandal Gold Classic Collection",
      brand: "Karnataka Soaps",
      description: "Pure sandalwood oil infused beauty bar.",
      category: "cosmetics",
      price: 340,
      mrp: 380,
      unit: "3 x 150g",
      image_url: "/images/legacy/photo-1608248543803-ba4f8c70ae0b",
      available: true,
      is_hamper: false,
      tags: ["heritage"],
      created_at: new Date().toISOString(),
    },
  ],
  [
    "The Gifting Edit",
    "Thoughtful gifts for every occasion.",
    "/images/legacy/photo-1549465220-1a8b9238cd48",
    "03",
    {
      id: "prod-hamp-1",
      slug: "palace-royal-dry-fruit-hamper",
      name: "Palace Heritage Royale Hamper",
      brand: "GLP Gifting",
      description: "Handcrafted festive gift hamper with cashews, almonds & figs.",
      category: "hampers",
      price: 1850,
      mrp: 2200,
      unit: "1 Box",
      image_url: "/images/legacy/photo-1549465220-1a8b9238cd48",
      available: true,
      is_hamper: true,
      tags: ["festive"],
      created_at: new Date().toISOString(),
    },
  ],
];

const fallbackProducts: Product[] = [
  {
    id: "prod-groc-1",
    slug: "aged-basmati-rice-5kg",
    name: "Royal Aged Basmati Rice (5kg)",
    brand: "Daawat Select",
    description: "Extra long aged grains with signature aroma.",
    category: "groceries",
    price: 650,
    mrp: 750,
    unit: "5 kg",
    image_url: "/images/legacy/photo-1556742049-0cfed4f6a45d",
    available: true,
    is_hamper: false,
    tags: ["bestseller", "staple"],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-dry-1",
    slug: "california-almonds-500g",
    name: "Premium California Almonds (500g)",
    brand: "GLP Signature",
    description: "Crisp, whole Grade-A almonds rich in natural oils.",
    category: "dry-fruits",
    price: 490,
    mrp: 580,
    unit: "500 g",
    image_url: "/images/legacy/dry-fruits.jpg",
    available: true,
    is_hamper: false,
    tags: ["healthy", "dry-fruits"],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-cosm-1",
    slug: "mysore-sandal-gold-luxury-pack",
    name: "Mysore Sandal Gold Classic Collection",
    brand: "Karnataka Soaps",
    description: "Pure natural sandalwood oil infused beauty bar.",
    category: "cosmetics",
    price: 340,
    mrp: 380,
    unit: "3 x 150g",
    image_url: "/images/legacy/photo-1608248543803-ba4f8c70ae0b",
    available: true,
    is_hamper: false,
    tags: ["fragrance", "heritage"],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-perf-1",
    slug: "oud-royale-attar-12ml",
    name: "Oud Royale Pure Concentrated Perfume",
    brand: "Al Haramain",
    description: "Traditional alcohol-free roll-on perfume oil.",
    category: "perfumes",
    price: 890,
    mrp: 1100,
    unit: "12 ml",
    image_url: "/images/legacy/photo-1547887538-e3a2f32cb1cc",
    available: true,
    is_hamper: false,
    tags: ["luxury", "perfume"],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-hamp-1",
    slug: "palace-royal-dry-fruit-hamper",
    name: "Palace Heritage Royale Hamper",
    brand: "GLP Gifting",
    description: "Handcrafted festive box packed with cashews, almonds & raisins.",
    category: "hampers",
    price: 1850,
    mrp: 2200,
    unit: "1 Box",
    image_url: "/images/legacy/photo-1549465220-1a8b9238cd48",
    available: true,
    is_hamper: true,
    tags: ["festive", "gift"],
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-acc-1",
    slug: "handwoven-jute-tote-bag",
    name: "Artisan Handwoven Jute Market Tote",
    brand: "Heritage Craft",
    description: "Durable eco-friendly carry bag with reinforced handles.",
    category: "accessories",
    price: 420,
    mrp: 500,
    unit: "1 Unit",
    image_url: "/images/legacy/photo-1553062407-98eeb64c6a62",
    available: true,
    is_hamper: false,
    tags: ["eco", "style"],
    created_at: new Date().toISOString(),
  },
];

const reveal = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  const { addItem } = useCart();
  const prefersReduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(fallbackProducts);
  const [introActive, setIntroActive] = useState(() => {
    return !sessionStorage.getItem("glp_intro_seen");
  });

  useEffect(() => {
    if (introActive) {
      const timer = setTimeout(() => {
        setIntroActive(false);
        sessionStorage.setItem("glp_intro_seen", "true");
      }, 1900);
      return () => clearTimeout(timer);
    }
  }, [introActive]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    apiGet<{ items: Product[] }>("/products?limit=12")
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setCatalogProducts(res.items);
        }
      })
      .catch(() => {
        // Safe fallback already seeded
      });
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: !prefersReduced });
    let frame: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    if (!prefersReduced) frame = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(frame);
    };
  }, [prefersReduced]);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };

  const handleQuickAdd = (product: Product) => {
    addItem(product, 1);
    toast.success(`Added ${product.name} to basket`, {
      description: "Delivering across Coimbatore with care.",
    });
  };

  const scrollShowcase = (direction: "left" | "right") => {
    if (showcaseRef.current) {
      const amount = 340;
      showcaseRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Welcome to the Good Luck Palace family!", {
      description: "You will receive our seasonal edits and counter specials.",
    });
    setNewsletterEmail("");
  };

  return (
    <>
      <Seo
        title="Good Luck Palace — A Legacy of Goodness (Est. 1983)"
        description="Coimbatore's cherished departmental store since 1983 on Cross Cut Road, Gandhipuram. Everyday groceries, authentic cosmetics, fine perfumes, dry fruits, and festive hampers."
      />

      {/* Top Hairline Scroll Progress Bar */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Page Load Intro Monogram Overlay */}
      {introActive && (
        <div className="intro-overlay" aria-hidden="true">
          <div className="intro-monogram">GL</div>
          <div className="intro-title">GOOD LUCK PALACE</div>
          <div className="intro-line" />
        </div>
      )}

      {/* 1. CINEMATIC HERO SECTION */}
      <section className="hero" ref={heroRef} data-testid="hero-section">
        <div className="hero-image" />
        <div className="hero-noise" />
        <div className="hero-content">
          <p className="eyebrow hero-reveal">EST. 1983 · CROSS CUT ROAD · GANDHIPURAM</p>
          <h1>
            <span className="line-mask whitespace-nowrap">
              <span>A legacy of trust.</span>
            </span>
            <span className="line-mask whitespace-nowrap">
              <span>A tradition of</span>
            </span>
            <span className="line-mask whitespace-nowrap">
              <span>goodness.</span>
            </span>
          </h1>
          <p className="hero-copy hero-reveal">
            Since 1983, Good Luck Palace has been part of Coimbatore&apos;s shopping story,
            bringing together thoughtfully selected essentials, everyday favourites and more
            under one roof.
          </p>
          <div className="hero-actions hero-reveal">
            <button
              type="button"
              className="button button-gold"
              onClick={() => scrollTo("#showcase")}
              data-testid="explore-legacy-button"
            >
              EXPLORE OUR COLLECTION <ArrowUpRight size={15} />
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => scrollTo("#story")}
              data-testid="discover-collection-button"
            >
              DISCOVER OUR STORY <ChevronRight size={15} />
            </button>
          </div>
        </div>
        <div className="hero-index">
          01 <span /> 06
        </div>
        <div className="hero-side-note">
          THE GOODNESS OF EVERYDAY
          <br />
          SINCE NINETEEN EIGHTY THREE
        </div>
        <div className="scroll-cue" onClick={() => scrollTo("#story")} role="button" tabIndex={0}>
          Scroll to discover <span />
        </div>
      </section>

      {/* 2. ANIMATED BRAND MARQUEE (GOLD TICKER) */}
      <div className="marquee" aria-label="Brand statement ticker">
        <div>
          ESTABLISHED 1983 <i>✦</i> EVERYDAY GOODNESS <i>✦</i> QUALITY &amp; VALUE <i>✦</i> TRUSTED
          ACROSS GENERATIONS <i>✦</i> ESTABLISHED 1983 <i>✦</i> EVERYDAY GOODNESS <i>✦</i> QUALITY
          &amp; VALUE <i>✦</i> TRUSTED ACROSS GENERATIONS <i>✦</i>
        </div>
      </div>

      {/* 3. RICHER INTERACTIVE HERITAGE STORY */}
      <motion.section
        id="story"
        className="story section-pad relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={reveal}
        data-testid="heritage-story-section"
      >
        <div className="section-kicker">01 / OUR STORY</div>
        <div className="story-grid">
          <div>
            <h2>
              More than a store.
              <br />
              <em>A part of Coimbatore&apos;s story.</em>
            </h2>
            <div className="mt-8 inline-flex items-center gap-2 border border-[#d4af37]/40 px-4 py-2 text-xs font-mono text-[#a78b27] uppercase tracking-widest bg-[#fbf9f5]">
              ✦ Cross Cut Road · Gandhipuram
            </div>
          </div>
          <div className="story-copy">
            <p className="lead">
              Since 1983, Good Luck Palace has built its place in the neighbourhood through a
              commitment to quality, thoughtful selection and honest pricing.
            </p>
            <p>
              What began as a retail destination has grown into a familiar part of everyday life for
              generations of Coimbatore families. Today, the tradition continues — preserving the
              same authentic counter experience, brought closer to you with modern convenience.
            </p>
            <a className="text-link" href="#aisles" data-testid="story-shop-link">
              DISCOVER OUR WORLD <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

        {/* Interactive Milestone Timeline */}
        <div className="timeline">
          <div className="timeline-line" />
          <div className="timeline-item timeline-highlight">
            <strong>1983</strong>
            <div>
              <b>The Beginning</b>
              <p>Good Luck Palace opens its doors on Cross Cut Road in Coimbatore.</p>
            </div>
          </div>
          <div className="timeline-item">
            <strong>∞</strong>
            <div>
              <b>Generations of Trust</b>
              <p>
                Thoughtfully selected essentials and everyday favourites, shared across Coimbatore
                families.
              </p>
            </div>
          </div>
          <div className="timeline-item">
            <strong>NOW</strong>
            <div>
              <b>The Tradition Continues</b>
              <p>
                The familiar Good Luck Palace experience, elevated with thoughtful service and
                delivery.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. DYNAMIC BRAND STATEMENT SECTION */}
      <section className="statement" data-testid="brand-statement">
        <div className="statement-ornament">✦</div>
        <p className="eyebrow">A GOOD LUCK PALACE ORIGINAL</p>
        <h2>
          Rooted in tradition.
          <br />
          <em>Trusted across generations.</em>
        </h2>
        <div className="statement-meta">
          <span>ESTABLISHED 1983</span>
          <span>CROSS CUT ROAD, COIMBATORE</span>
          <span>CHOICE WITH CARE</span>
          <span>TRUSTED BY GENERATIONS</span>
        </div>
      </section>

      {/* 5. ASYMMETRIC LUXURY CATEGORY GRID (SHOP BY AISLE) */}
      <motion.section
        id="aisles"
        className="aisles section-pad"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={reveal}
        data-testid="aisles-section"
      >
        <div className="section-heading">
          <div>
            <div className="section-kicker">02 / THE COLLECTION</div>
            <h2>
              Shop by <em>aisle.</em>
            </h2>
          </div>
          <p>
            Everyday essentials, thoughtful picks and
            <br />
            timeless favourites across our departments.
          </p>
        </div>

        <div className="category-grid category-grid-asymmetric">
          {categories.map((cat, i) => (
            <Link
              to={cat.path}
              className={`category-card ${cat.className}`}
              key={cat.title}
              data-testid={`category-card-${i + 1}`}
            >
              <img src={cat.image} alt={cat.title} loading="lazy" />
              <div className="category-shade" />
              <span className="category-num">{cat.num}</span>
              <div className="category-info">
                <h3>{cat.title}</h3>
                <p>{cat.sub}</p>
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* 6. INTERACTIVE HORIZONTAL PRODUCT SHOWCASE ("Discover the Goodness") */}
      <section id="showcase" className="showcase-section" data-testid="product-showcase-section">
        <div className="showcase-header">
          <div>
            <div className="section-kicker">03 / LIVE FROM OUR COUNTER</div>
            <h2 className="font-serif text-[clamp(32px,4vw,48px)] font-medium text-[#25070d] leading-tight m-0">
              Discover the <em>Goodness.</em>
            </h2>
            <p className="font-sans text-[15px] text-[#776a64] mt-2 mb-0">
              Hand-picked staples, authentic personal care, and gourmet dry fruits currently
              available in-store.
            </p>
          </div>
          <div className="showcase-controls">
            <button
              type="button"
              className="showcase-btn"
              onClick={() => scrollShowcase("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="showcase-btn"
              onClick={() => scrollShowcase("right")}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="showcase-track" ref={showcaseRef}>
          {catalogProducts.map((p) => {
            const off =
              p.mrp && p.mrp > p.price
                ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
                : 0;
            return (
              <div className="showcase-card" key={p.id} data-testid={`showcase-card-${p.slug}`}>
                <div className="showcase-card-img-wrap">
                  <img
                    src={p.image_url || "/images/legacy/dry-fruits.jpg"}
                    alt={p.name}
                    loading="lazy"
                  />
                  {off > 0 && <span className="showcase-badge-discount">{off}% OFF</span>}
                  <span className="showcase-badge-tag">{p.category}</span>
                </div>
                <div className="showcase-card-body">
                  <div>
                    <span className="showcase-card-brand">{p.brand || "GLP Select"}</span>
                    <h3 className="showcase-card-title">
                      <Link to={`/products/${p.slug}`} className="hover:text-[#a78b27] transition-colors">
                        {p.name}
                      </Link>
                    </h3>
                  </div>
                  <div className="showcase-card-footer">
                    <div className="showcase-price-box">
                      <span className="showcase-price">{inr(p.price)}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="showcase-mrp">{inr(p.mrp)}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="showcase-quick-add"
                      onClick={() => handleQuickAdd(p)}
                      aria-label={`Add ${p.name} to basket`}
                      title="Quick Add to Basket"
                    >
                      <ShoppingBag size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-[10vw] pt-4 text-center">
          <Link to="/groceries" className="text-link inline-flex">
            VIEW FULL STORE CATALOGUE <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* 7. PREMIUM COLLECTION EDITORIAL SPREAD (SPLIT-SCREEN) */}
      <section className="editorial-split-section" data-testid="editorial-split-section">
        <div className="editorial-split-left">
          <div className="section-kicker">04 / EDITORIAL SPOTLIGHT</div>
          <h2>
            Everyday essentials.
            <br />
            <em>Thoughtfully chosen.</em>
          </h2>
          <p>
            From the finest aged grains to artisanal fragrances and hand-selected nuts, every single
            item on our shelves passes through generations of discerning curation. We source
            directly from trusted producers to bring uncompromised purity to Coimbatore homes.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/groceries" className="button button-gold">
              EXPLORE OUR EDITS <ArrowUpRight size={16} />
            </Link>
            <div className="text-xs font-mono tracking-widest text-[#a78b27] uppercase">
              ✦ Hand-Selected Daily
            </div>
          </div>
        </div>

        <div className="editorial-split-right">
          <div className="editorial-split-img-frame">
            <img
              src="/images/legacy/photo-1556742049-0cfed4f6a45d"
              alt="Good Luck Palace premium counter collection"
              loading="lazy"
            />
          </div>
          <div className="editorial-floating-badge">
            <strong>CURATED FOR COIMBATORE</strong>
            <br />
            <span>ESTABLISHED 1983 · CROSS CUT ROAD</span>
          </div>
        </div>
      </section>

      {/* 8. FULL-WIDTH OVERSIZED TYPOGRAPHY SECTION */}
      <section className="oversized-type-section" data-testid="oversized-type-section">
        <div className="oversized-type-watermark" aria-hidden="true">
          GOOD LUCK
        </div>
        <div className="relative z-10 max-w-[920px] mx-auto">
          <p className="eyebrow text-[#e9d98e]">OUR CORE PHILOSOPHY</p>
          <h2 className="oversized-type-heading">
            &ldquo;GOODNESS IS IN THE <em>DETAILS.</em>&rdquo;
          </h2>
          <div className="oversized-type-divider">
            <span />
            <i>✦</i>
            <span />
          </div>
          <p className="oversized-type-desc">
            Four decades of uncompromised freshness, honest weight, and neighbourhood trust on
            Cross Cut Road. We believe the items you welcome into your daily life should always be
            worthy of your home.
          </p>
        </div>
      </section>

      {/* 9. FRESH ON THE SHELVES (UPGRADED HOUSE PICKS) */}
      <motion.section
        id="picks"
        className="picks section-pad"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
        variants={reveal}
        data-testid="picks-section"
      >
        <div className="section-heading">
          <div>
            <div className="section-kicker">05 / HOUSE PICKS</div>
            <h2>
              Fresh on the <em>shelves.</em>
            </h2>
          </div>
          <Link className="text-link" to="/groceries" data-testid="view-all-picks-link">
            VIEW ALL COLLECTIONS <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="picks-grid">
          {picks.map(([title, sub, image, num, product], i) => (
            <article
              className={`pick-card pick-${i + 1}`}
              key={title as string}
              data-testid={`pick-card-${i + 1}`}
            >
              <div className="pick-image">
                <img src={image as string} alt={title as string} loading="lazy" />
                <span>0{num as string}</span>
                <button
                  type="button"
                  className="pick-add"
                  aria-label={`Add ${title}`}
                  data-testid={`add-pick-${i + 1}`}
                  onClick={() => handleQuickAdd(product as Product)}
                >
                  <ShoppingBag size={16} />
                </button>
              </div>
              <div className="pick-meta">
                <div>
                  <h3>{title as string}</h3>
                  <p>{sub as string}</p>
                </div>
                <ArrowUpRight size={18} />
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      {/* 06. CUSTOMER TRUST SECTION */}
      <section className="trust-section" data-testid="trust-section">
        <div className="text-center max-w-[680px] mx-auto">
          <div className="section-kicker">06 / NEIGHBOURHOOD HERITAGE</div>
          <h2 className="font-serif text-[clamp(30px,4vw,44px)] font-medium text-[#25070d] leading-tight">
            Why generations choose <em>Good Luck Palace.</em>
          </h2>
          <p className="font-sans text-[15px] text-[#776a64] mt-2 mb-0">
            A shopping tradition carried forward by families across Coimbatore for over forty years.
          </p>
        </div>

        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-icon-box">
              <Award size={24} />
            </div>
            <h3>A Legacy Since 1983</h3>
            <p>
              Four decades rooted in the heart of Gandhipuram, serving generations of families with
              consistent honesty.
            </p>
          </div>

          <div className="trust-card">
            <div className="trust-icon-box">
              <ShieldCheck size={24} />
            </div>
            <h3>Thoughtfully Selected</h3>
            <p>
              Hand-inspected grains, authentic cosmetics, and fresh dry fruits chosen with family
              care.
            </p>
          </div>

          <div className="trust-card">
            <div className="trust-icon-box">
              <HeartHandshake size={24} />
            </div>
            <h3>Everyday Quality &amp; Value</h3>
            <p>
              Honest weights, transparent pricing, and dependable standards with zero compromise on
              freshness.
            </p>
          </div>

          <div className="trust-card">
            <div className="trust-icon-box">
              <MapPin size={24} />
            </div>
            <h3>A Familiar Destination</h3>
            <p>
              A warm, welcoming neighbourhood store on Cross Cut Road where shopping feels like
              coming home.
            </p>
          </div>
        </div>
      </section>

      {/* 07. FESTIVE & GIFT HAMPERS EDITORIAL SECTION */}
      <section className="gift-section" data-testid="gift-section">
        <div className="gift-copy">
          <div className="section-kicker">07 / FESTIVE &amp; SPECIAL OCCASIONS</div>
          <h2>
            Goodness,
            <br />
            <em>gathered.</em>
          </h2>
          <p>
            Thoughtfully chosen pieces and meaningful finds for weddings, festivals, and the moments
            that deserve a little more.
          </p>
          <Link className="button button-dark" to="/hampers" data-testid="gift-collection-button">
            EXPLORE OUR COLLECTION <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="gift-image">
          <img
            src="/images/legacy/photo-1602173574767-37ac01994b2a"
            alt="Good Luck Palace gift selection"
            loading="lazy"
          />
        </div>
        <Sparkles className="gift-sparkle" size={22} />
      </section>
    </>
  );
}
