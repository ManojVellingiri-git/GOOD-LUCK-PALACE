import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import Seo from "@/components/Seo";
import { apiGet } from "@/lib/api";
import type { Category, ProductPage } from "@/lib/types";

// Category listing: SEO-friendly URL (e.g. /cosmetics, /dry-fruits), filters, sort, pagination.
export default function CategoryPage({ slug: slugProp }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = slugProp ?? params.slug ?? "";
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const cat = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });
  const category = (cat.data ?? []).find((c) => c.slug === slug);

  const brandsQ = useQuery({
    queryKey: ["brands", slug],
    queryFn: () => apiGet<string[]>(`/products/brands?category=${slug}`),
  });

  const qs = new URLSearchParams({ category: slug, sort, page: String(page), limit: "24" });
  if (q.trim()) qs.set("q", q.trim());
  if (brand !== "all") qs.set("brand", brand);
  if (inStockOnly) qs.set("available", "true");

  const products = useQuery({
    queryKey: ["products", "category", slug, qs.toString()],
    queryFn: () => apiGet<ProductPage>(`/products?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });

  const title = category ? category.name : slug;
  const setPageSafe = (p: number) => {
    setPage(Math.min(Math.max(1, p), products.data?.pages ?? 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="paper-grain">
      <Seo
        title={category?.seo_title || `${title} | Good Luck Palace Coimbatore`}
        description={category?.seo_description || `Shop ${title} at Good Luck Palace, Cross Cut Road, Gandhipuram, Coimbatore. Order online or on WhatsApp.`}
      />

      {/* Category banner */}
      <section className="bg-heritage py-12 text-[#FAF7F2]" data-testid="category-banner">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-mono text-xs tracking-widest text-[#FDE68A]">GOOD LUCK PALACE · EST. 1983</p>
          <h1 className="mt-2 font-heading text-4xl font-bold">{title}</h1>
          {category?.description && <p className="mt-2 max-w-2xl text-[#D6D3D1]">{category.description}</p>}
        </div>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E7E2DA] bg-white p-3 shadow-[0_4px_20px_rgba(28,21,18,0.06)]" data-testid="category-filters">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder={`Search in ${title.toLowerCase()}…`}
            className="w-full max-w-56"
            aria-label={`Search in ${title}`}
            data-testid="category-search-input"
          />
          <Select value={brand} onValueChange={(v) => { setBrand(v); setPage(1); }}>
            <SelectTrigger className="w-40" data-testid="brand-filter" aria-label="Filter by brand">
              <SelectValue>{brand === "all" ? "All brands" : brand}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {(brandsQ.data ?? []).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-44" data-testid="sort-filter" aria-label="Sort products">
              <SelectValue>{(v) => ({ newest: "Newest first", "price_asc": "Price: low to high", "price_desc": "Price: high to low", name: "Name A–Z" })[v as string] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Label className="flex items-center gap-2 text-sm" data-testid="availability-filter">
            <Checkbox checked={inStockOnly} onCheckedChange={(c) => { setInStockOnly(c === true); setPage(1); }} aria-label="In stock only" data-testid="availability-checkbox" />
            In stock only
          </Label>
          <span className="ml-auto font-mono text-xs text-[#78716C]" data-testid="category-result-count">
            {products.data ? `${products.data.total} items` : ""}
          </span>
        </div>

        {/* Grid */}
        {products.isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#F0EBE2]" />
            ))}
          </div>
        ) : products.data && products.data.items.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6" data-testid="product-grid">
            {products.data.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-[#E7E2DA] bg-white p-12 text-center" data-testid="category-empty">
            <p className="font-heading text-xl font-semibold text-[#1C1917]">Nothing matches here</p>
            <p className="mt-2 text-sm text-[#57534E]">Try a different search or clear the filters.{searchParams.get("q") ? "" : ""}</p>
          </div>
        )}

        {/* Pagination */}
        {products.data && products.data.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3" data-testid="category-pagination">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPageSafe(page - 1)} data-testid="page-prev">Previous</Button>
            <span className="font-mono text-sm text-[#57534E]">Page {products.data.page} of {products.data.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= products.data.pages} onClick={() => setPageSafe(page + 1)} data-testid="page-next">Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
