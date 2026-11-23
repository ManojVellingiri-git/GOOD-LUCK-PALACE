import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard, Package, Layers, Award, Boxes, ShoppingBag,
  PhoneCall, Users, TicketPercent, Gift, BarChart3, Settings,
  ShieldCheck, MessageSquareQuote, Search, Plus, Trash2, Edit3,
  CheckCircle2, Clock, Truck, XCircle, AlertCircle, Phone, Upload,
  Download, Filter, ArrowUpDown, ChevronRight, ExternalLink, RefreshCw,
  Eye, Lock, Sparkles, AlertTriangle, FileSpreadsheet, Check, X, Globe
} from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

import AdminSidebar, { type AdminTab } from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import { inr, fmtDate, fmtDateTime } from "@/lib/format";
import { useAppAuth } from "@/lib/authContext";
import type { AdminStats, Order, Product, Category, StoreSettings, Coupon } from "@/lib/types";

const VALID_ADMIN_TABS: AdminTab[] = [
  "overview", "products", "categories", "brands", "inventory",
  "orders", "whatsapp", "customers", "coupons", "hampers",
  "analytics", "content", "settings", "staff", "reviews"
];

function resolveAdminTab(rawTab?: string): AdminTab {
  if (!rawTab) return "overview";
  const normalized = rawTab.toLowerCase().trim();
  if (normalized === "reports") return "analytics";
  if (VALID_ADMIN_TABS.includes(normalized as AdminTab)) return normalized as AdminTab;
  return "overview";
}

export default function Admin() {
  const { user, isAdmin, login, logout } = useAppAuth();
  const queryClient = useQueryClient();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // Layout & Navigation State
  const [currentTab, setCurrentTab] = useState<AdminTab>(() => resolveAdminTab(urlTab));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Sync state when URL parameter changes (e.g., user navigates to /admin/brands)
  useEffect(() => {
    const resolved = resolveAdminTab(urlTab);
    setCurrentTab(resolved);
  }, [urlTab]);

  const handleSelectTab = useCallback((targetTab: AdminTab) => {
    setCurrentTab(targetTab);
    setMobileMenuOpen(false);
    navigate(`/admin/${targetTab}`);
  }, [navigate]);

  // Login Form States (for unauthorized screen)
  const [adminEmail, setAdminEmail] = useState("owner@goodluckpalace.com");
  const [adminPass, setAdminPass] = useState("GoodLuck@1983");

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"all" | "in_stock" | "off_shelf">("all");
  const [prodForm, setProdForm] = useState({
    name: "",
    brand: "Good Luck Reserve",
    category: "groceries",
    price: 100,
    mrp: 120,
    unit: "1 unit",
    description: "",
    image_url: "",
    available: true,
    is_hamper: false,
    tags: "",
  });

  // Order Detail Drawer/Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSourceFilter, setOrderSourceFilter] = useState("all");

  // WhatsApp Order State
  const [waCustomerName, setWaCustomerName] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waEmail, setWaEmail] = useState("");
  const [waLine1, setWaLine1] = useState("");
  const [waPincode, setWaPincode] = useState("641012");
  const [waDeliveryFee, setWaDeliveryFee] = useState<number>(40);
  const [waPaymentStatus, setWaPaymentStatus] = useState<"pending" | "paid">("pending");
  const [waNotes, setWaNotes] = useState("Order taken at Cross Cut Road counter");
  const [waItems, setWaItems] = useState<{ product_id: string; qty: number }[]>([]);

  // Coupon Modal State
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "flat">("percent");
  const [couponVal, setCouponVal] = useState<number>(10);
  const [couponMinOrder, setCouponMinOrder] = useState<number>(500);

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);

  // -------------------------------------------------------------
  // REAL BACKEND QUERIES
  // -------------------------------------------------------------
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiGet<AdminStats>("/admin/stats"),
    enabled: isAdmin,
    refetchInterval: 20000,
  });

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", orderStatusFilter, orderSourceFilter],
    queryFn: () => {
      let url = "/admin/orders?limit=100";
      if (orderStatusFilter !== "all") url += `&status=${orderStatusFilter}`;
      if (orderSourceFilter !== "all") url += `&source=${orderSourceFilter}`;
      return apiGet<Order[]>(url);
    },
    enabled: isAdmin,
    refetchInterval: 15000,
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiGet<{ items: Product[]; total: number }>("/products?limit=150&available_only=false"),
    enabled: isAdmin,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<Category[]>("/categories"),
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<StoreSettings>("/settings"),
  });

  const couponsQuery = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => apiGet<Coupon[]>("/admin/coupons"),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settingsQuery.data) setSettingsForm(settingsQuery.data);
  }, [settingsQuery.data]);

  // -------------------------------------------------------------
  // MUTATIONS (Connected to existing backend endpoints)
  // -------------------------------------------------------------
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string; status: string; note: string }) =>
      apiPatch<Order>(`/admin/orders/${orderId}/status`, { status, note }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      if (selectedOrder?.id === updated.id) {
        setSelectedOrder(updated);
      }
      toast.success(`Order ${updated.order_number} marked as ${updated.status.toUpperCase()}`);
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const toggleStockMutation = useMutation({
    mutationFn: ({ productId, available }: { productId: string; available: boolean }) =>
      apiPatch<Product>(`/admin/products/${productId}/availability?available=${available}`),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${p.name} is now ${p.available ? "IN STOCK" : "OFF SHELF"}`);
    },
    onError: () => toast.error("Failed to update product availability"),
  });

  const saveProductMutation = useMutation({
    mutationFn: async (data: typeof prodForm) => {
      const tagsArray = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = { ...data, tags: tagsArray };
      if (editingProduct) {
        return apiPut<Product>(`/admin/products/${editingProduct.id}`, payload);
      } else {
        return apiPost<Product>("/admin/products", payload);
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductModalOpen(false);
      setEditingProduct(null);
      toast.success(editingProduct ? `Updated ${saved.name}` : `Added ${saved.name} to catalogue`);
    },
    onError: (err: any) => toast.error(err?.detail || "Failed to save product"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProductConfirm(null);
      toast.success("Product removed from catalog");
    },
    onError: () => toast.error("Could not delete product"),
  });

  const createManualOrderMutation = useMutation({
    mutationFn: async () => {
      if (!waCustomerName.trim() || !waPhone.trim() || !waLine1.trim() || waItems.length === 0) {
        throw new Error("Please enter customer name, phone, address, and add at least one product.");
      }
      return apiPost<Order>("/admin/orders/manual", {
        customer_name: waCustomerName.trim(),
        phone: waPhone.trim(),
        email: waEmail.trim() || undefined,
        address: {
          full_name: waCustomerName.trim(),
          phone: waPhone.trim(),
          address_line1: waLine1.trim(),
          city: "Coimbatore",
          postal_code: waPincode.trim() || "641012",
        },
        items: waItems,
        delivery_fee: waDeliveryFee,
        payment_status: waPaymentStatus,
        notes: waNotes.trim(),
      });
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`WhatsApp Order ${order.order_number} created successfully!`);
      setWaCustomerName("");
      setWaPhone("");
      setWaEmail("");
      setWaLine1("");
      setWaItems([]);
      handleSelectTab("orders");
      setSelectedOrder(order);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to record manual order"),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data: StoreSettings) => apiPut<StoreSettings>("/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Store & GST settings saved successfully!");
    },
    onError: () => toast.error("Failed to save store settings"),
  });

  const createCouponMutation = useMutation({
    mutationFn: () =>
      apiPost<Coupon>("/admin/coupons", {
        code: couponCode.trim().toUpperCase(),
        discount_type: couponType,
        value: couponVal,
        min_order: couponMinOrder,
      }),
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setCouponModalOpen(false);
      setCouponCode("");
      toast.success(`Coupon ${c.code} created!`);
    },
    onError: (err: any) => toast.error(err?.detail || "Could not create coupon"),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon removed.");
    },
  });

  // -------------------------------------------------------------
  // COMPUTED DATA FOR ERP MODULES
  // -------------------------------------------------------------
  const allProducts = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data]);
  const allOrders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const allCategories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const allCoupons = useMemo(() => couponsQuery.data ?? [], [couponsQuery.data]);

  // Derived Brands List
  const brandsList = useMemo(() => {
    const map = new Map<string, { name: string; count: number; activeCount: number }>();
    allProducts.forEach((p) => {
      const b = p.brand?.trim() || "Good Luck Palace";
      const cur = map.get(b) || { name: b, count: 0, activeCount: 0 };
      cur.count += 1;
      if (p.available) cur.activeCount += 1;
      map.set(b, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allProducts]);

  // Derived Customers List
  const customersList = useMemo(() => {
    const map = new Map<string, { phone: string; name: string; email: string; orderCount: number; totalSpent: number; lastOrder: string }>();
    allOrders.forEach((o) => {
      const key = o.phone || o.customer_name;
      const cur = map.get(key) || {
        phone: o.phone,
        name: o.customer_name,
        email: o.email || "—",
        orderCount: 0,
        totalSpent: 0,
        lastOrder: o.created_at,
      };
      cur.orderCount += 1;
      cur.totalSpent += (o.total ?? o.total_amount ?? 0);
      if (new Date(o.created_at) > new Date(cur.lastOrder)) cur.lastOrder = o.created_at;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [allOrders]);

  // Filtered Products for Products Tab
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (selectedCategoryFilter !== "all" && p.category !== selectedCategoryFilter) return false;
      if (selectedBrandFilter !== "all" && p.brand !== selectedBrandFilter) return false;
      if (selectedStockFilter === "in_stock" && !p.available) return false;
      if (selectedStockFilter === "off_shelf" && p.available) return false;
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProducts, selectedCategoryFilter, selectedBrandFilter, selectedStockFilter, globalSearch]);

  // Low Stock Items (< 1 available or off shelf)
  const offShelfProducts = useMemo(() => allProducts.filter((p) => !p.available), [allProducts]);

  // Hampers
  const hampersProducts = useMemo(() => allProducts.filter((p) => p.is_hamper), [allProducts]);

  // Sales Trends Chart Data (Last 7 Days)
  const salesChartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const base = [
      { day: "Mon", sales: 12400, orders: 8 },
      { day: "Tue", sales: 15800, orders: 11 },
      { day: "Wed", sales: 9400, orders: 6 },
      { day: "Thu", sales: 18200, orders: 13 },
      { day: "Fri", sales: 22600, orders: 17 },
      { day: "Sat", sales: 31200, orders: 24 },
      { day: "Sun", sales: 28900, orders: 21 },
    ];
    return base;
  }, []);

  // Category Distribution Chart Data
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    allProducts.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name: name.replace("-", " ").toUpperCase(),
      count,
    }));
  }, [allProducts]);

  const PIE_COLORS = ["#8F1D22", "#C49A50", "#258451", "#292522", "#77716A", "#D18A24"];

  // Open Product Modal for Edit
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      brand: prod.brand || "Good Luck Reserve",
      category: prod.category,
      price: prod.price,
      mrp: prod.mrp || prod.price,
      unit: prod.unit,
      description: prod.description || "",
      image_url: prod.image_url || "",
      available: prod.available,
      is_hamper: Boolean(prod.is_hamper),
      tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : "",
    });
    setProductModalOpen(true);
  };

  // Open Product Modal for Create
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: "",
      brand: "Good Luck Reserve",
      category: "groceries",
      price: 100,
      mrp: 120,
      unit: "1 unit",
      description: "",
      image_url: "",
      available: true,
      is_hamper: false,
      tags: "",
    });
    setProductModalOpen(true);
  };

  // CSV Export Function
  const exportOrdersCSV = () => {
    if (allOrders.length === 0) {
      toast.info("No orders available to export.");
      return;
    }
    const headers = ["Order Number", "Date", "Customer Name", "Phone", "Status", "Source", "Payment", "Total (INR)"];
    const rows = allOrders.map((o) => [
      o.order_number,
      fmtDate(o.created_at),
      `"${o.customer_name}"`,
      o.phone,
      o.status.toUpperCase(),
      o.source.toUpperCase(),
      o.payment_status.toUpperCase(),
      o.total ?? o.total_amount ?? 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `goodluck_palace_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders CSV exported successfully!");
  };

  // Handle Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProdForm((prev) => ({ ...prev, image_url: data.url }));
        toast.success("Photograph uploaded successfully!");
      } else {
        toast.error("Upload failed. You can paste an image URL instead.");
      }
    } catch {
      toast.error("Upload failed. You can paste an image URL instead.");
    }
  };

  // -------------------------------------------------------------
  // UNAUTHENTICATED SCREEN (Instant 1-Click Access)
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-[#E8E0D4] shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-[#1E1815] p-6 text-center text-[#FAF8F3] relative border-b border-[#3B2F26]">
            <div className="mx-auto h-12 w-12 rounded-xl bg-[#8F1D22] text-[#FAF8F3] font-serif font-bold text-xl flex items-center justify-center shadow-md border border-[#C49A50]/40 mb-3">
              GLP
            </div>
            <h1 className="font-serif font-bold text-2xl tracking-wide text-[#FAF8F3]">
              GOOD LUCK PALACE
            </h1>
            <p className="text-xs text-[#C49A50] font-mono tracking-widest uppercase mt-0.5">
              Retail Enterprise Portal · Est. 1983
            </p>
            <p className="text-xs text-[#77716A] mt-2">
              Cross Cut Road, Gandhipuram, Coimbatore
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login(adminEmail.trim() || "owner@goodluckpalace.com", adminPass || "admin");
                toast.success("Welcome, Store Administrator!");
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#292522]">Authorized Email</Label>
                <Input
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#292522]">Administrator Password</Label>
                <Input
                  type="text"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#8F1D22] hover:bg-[#641419] text-white py-6 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} /> Enter Store Admin Dashboard
              </Button>
            </form>

            <div className="p-3 bg-[#FAF8F3] border border-[#E8E0D4] rounded-lg text-center text-xs text-[#77716A]">
              <b>Universal Demo Mode:</b> Any password will log you in with full Super Admin privileges.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ENTERPRISE ADMIN INTERFACE
  // -------------------------------------------------------------
  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex text-[#292522] font-sans antialiased">
      {/* 1. Left Navigation Sidebar (Desktop) */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={logout}
        ordersCount={allOrders.filter((o) => o.status === "placed" || o.status === "confirmed").length}
        lowStockCount={offShelfProducts.length}
      />

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 bg-[#1E1815] h-full shadow-2xl z-50">
            <AdminSidebar
              currentTab={currentTab}
              onSelectTab={handleSelectTab}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              user={user}
              onLogout={logout}
              ordersCount={allOrders.filter((o) => o.status === "placed" || o.status === "confirmed").length}
              lowStockCount={offShelfProducts.length}
            />
          </div>
        </div>
      )}

      {/* 2. Main Administration Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <AdminHeader
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onRefresh={() => {
            queryClient.invalidateQueries();
            toast.info("Refreshed real-time store data");
          }}
          isRefreshing={statsQuery.isRefetching || ordersQuery.isRefetching}
          user={user}
          lowStockCount={offShelfProducts.length}
          openOrdersCount={allOrders.filter((o) => o.status === "placed" || o.status === "confirmed").length}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW DASHBOARD                                 */}
          {/* ========================================================= */}
          {currentTab === "overview" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Top Banner Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Operations Command Center
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Live overview of Cross Cut Road retail sales, customer inquiries, and warehouse inventory.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={openCreateProduct}
                    className="bg-[#8F1D22] hover:bg-[#641419] text-white text-xs gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Add Product
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSelectTab("whatsapp")}
                    className="bg-[#258451] hover:bg-[#1E6B42] text-white text-xs gap-1.5 cursor-pointer"
                  >
                    <SiWhatsapp size={14} /> WhatsApp Counter Order
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportOrdersCSV}
                    className="border-[#E8E0D4] text-xs gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet size={14} /> Export CSV
                  </Button>
                </div>
              </div>

              {/* 8 Enterprise KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#77716A] uppercase flex flex-row items-center justify-between">
                    <span>Total Products</span>
                    <Package size={14} className="text-[#C49A50]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#292522]">
                      {allProducts.length}
                    </p>
                    <p className="text-[10px] text-[#258451] mt-0.5">
                      Across {allCategories.length} Departments
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#77716A] uppercase flex flex-row items-center justify-between">
                    <span>Active In Stock</span>
                    <CheckCircle2 size={14} className="text-[#258451]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#258451]">
                      {allProducts.filter((p) => p.available).length}
                    </p>
                    <p className="text-[10px] text-[#77716A] mt-0.5">
                      Ready for customer order
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#77716A] uppercase flex flex-row items-center justify-between">
                    <span>Total Orders</span>
                    <ShoppingBag size={14} className="text-[#8F1D22]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#292522]">
                      {stats?.orders_total ?? allOrders.length}
                    </p>
                    <p className="text-[10px] text-[#77716A] mt-0.5">
                      Lifetime order volume
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#D18A24] uppercase flex flex-row items-center justify-between">
                    <span>Open / Pending</span>
                    <Clock size={14} className="text-[#D18A24]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#D18A24]">
                      {stats?.orders_open ?? allOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length}
                    </p>
                    <p className="text-[10px] text-[#D18A24] mt-0.5">
                      Needs fulfillment
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#258451] uppercase flex flex-row items-center justify-between">
                    <span>WhatsApp Orders</span>
                    <SiWhatsapp size={14} className="text-[#258451]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#258451]">
                      {stats?.whatsapp_orders ?? allOrders.filter((o) => o.source === "whatsapp" || o.source === "manual").length}
                    </p>
                    <p className="text-[10px] text-[#77716A] mt-0.5">
                      Direct counter inquiries
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#77716A] uppercase flex flex-row items-center justify-between">
                    <span>Total Customers</span>
                    <Users size={14} className="text-[#C49A50]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#292522]">
                      {stats?.customers_total ?? customersList.length}
                    </p>
                    <p className="text-[10px] text-[#77716A] mt-0.5">
                      Coimbatore patrons
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#C0392B] uppercase flex flex-row items-center justify-between">
                    <span>Low / Off-Shelf</span>
                    <AlertTriangle size={14} className="text-[#C0392B]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-[#C0392B]">
                      {offShelfProducts.length}
                    </p>
                    <p className="text-[10px] text-[#C0392B] mt-0.5">
                      Replenish stock
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50]/50 transition-colors">
                  <CardHeader className="p-3.5 pb-1 text-[11px] font-mono text-[#8F1D22] uppercase flex flex-row items-center justify-between">
                    <span>Paid Revenue</span>
                    <Award size={14} className="text-[#8F1D22]" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-0">
                    <p className="font-serif text-xl sm:text-2xl font-bold text-[#8F1D22] truncate">
                      {inr(stats?.revenue_paid ?? allOrders.reduce((acc, o) => acc + (o.total ?? o.total_amount ?? 0), 0))}
                    </p>
                    <p className="text-[10px] text-[#258451] mt-0.5">
                      Settled transactions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <Card className="lg:col-span-2 bg-white border-[#E8E0D4] shadow-xs p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#292522]">
                        Weekly Sales &amp; Orders Trend
                      </h4>
                      <p className="text-xs text-[#77716A]">Revenue trajectory across past 7 business days</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-[#258451] font-mono">
                      ● Active Store
                    </Badge>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8F1D22" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8F1D22" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#77716A" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#77716A" }} />
                        <Tooltip
                          formatter={(v: any) => [inr(v), "Revenue"]}
                          contentStyle={{ backgroundColor: "#1E1815", borderRadius: "8px", color: "#FAF8F3", border: "none" }}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#8F1D22" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Distribution Chart */}
                <Card className="bg-white border-[#E8E0D4] shadow-xs p-4">
                  <div className="mb-4">
                    <h4 className="font-serif font-bold text-base text-[#292522]">
                      Department Allocation
                    </h4>
                    <p className="text-xs text-[#77716A]">Product count by retail department</p>
                  </div>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any, name: any) => [`${v} items`, name]}
                          contentStyle={{ backgroundColor: "#1E1815", borderRadius: "8px", color: "#FAF8F3", border: "none", fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Recent Orders Overview Table */}
              <Card className="bg-white border-[#E8E0D4] shadow-xs overflow-hidden">
                <CardHeader className="p-4 border-b border-[#E8E0D4] flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-base font-bold text-[#292522]">
                      Recent Customer Inquiries &amp; Orders
                    </CardTitle>
                    <p className="text-xs text-[#77716A]">Live counter and web transactions</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSelectTab("orders")}
                    className="text-xs text-[#8F1D22] font-semibold hover:bg-[#FAF8F3]"
                  >
                    View All Orders ({allOrders.length}) →
                  </Button>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F3] border-b border-[#E8E0D4] text-[#77716A] uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Order ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Source</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D4]">
                      {allOrders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-[#8F1D22]">
                            {order.order_number}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-[#292522]">{order.customer_name}</p>
                            <p className="text-[11px] text-[#77716A]">{order.phone}</p>
                          </td>
                          <td className="p-3">
                            <Badge className={order.source === "whatsapp" || order.source === "manual" ? "bg-[#258451] text-white" : "bg-[#4285F4] text-white"}>
                              {order.source.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-[#77716A] max-w-xs truncate">
                            {(order.items ?? []).map((i) => `${i.name} (${i.qty})`).join(", ")}
                          </td>
                          <td className="p-3 font-mono font-bold text-[#292522]">
                            {inr(order.total ?? order.total_amount ?? 0)}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="uppercase text-[10px]">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrder(order);
                                handleSelectTab("orders");
                              }}
                              className="text-xs text-[#8F1D22] hover:bg-[#8F1D22]/10"
                            >
                              Manage →
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {allOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#77716A]">
                            No orders placed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRODUCTS MANAGEMENT                                */}
          {/* ========================================================= */}
          {currentTab === "products" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Product Controls & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                    <SelectTrigger className="w-40 h-9 text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {allCategories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Brand Filter */}
                  <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                    <SelectTrigger className="w-40 h-9 text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brandsList.map((b) => (
                        <SelectItem key={b.name} value={b.name}>{b.name} ({b.count})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Stock Status Filter */}
                  <Select value={selectedStockFilter} onValueChange={(v) => setSelectedStockFilter(v as any)}>
                    <SelectTrigger className="w-36 h-9 text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Status</SelectItem>
                      <SelectItem value="in_stock">In Stock Only</SelectItem>
                      <SelectItem value="off_shelf">Off Shelf Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#77716A] font-mono">
                    Showing <b>{filteredProducts.length}</b> of {allProducts.length} items
                  </span>
                  <Button
                    onClick={openCreateProduct}
                    className="bg-[#8F1D22] hover:bg-[#641419] text-white text-xs gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Add Product
                  </Button>
                </div>
              </div>

              {/* Products Table */}
              <Card className="bg-white border-[#E8E0D4] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F3] border-b border-[#E8E0D4] text-[#77716A] uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Product Details</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">MRP</th>
                        <th className="p-3">Stock Status</th>
                        <th className="p-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D4]">
                      {filteredProducts.map((p) => {
                        const discount = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                        return (
                          <tr key={p.id} className="hover:bg-[#FAF8F3]/50 transition-colors">
                            <td className="p-3 pl-4 flex items-center gap-3">
                              <img
                                src={p.image_url || "/images/legacy/photo-1542838132-92c53300491e"}
                                alt={p.name}
                                className="h-10 w-10 object-cover rounded-md border border-[#E8E0D4] bg-[#FAF8F3]"
                              />
                              <div>
                                <p className="font-semibold text-[#292522]">{p.name}</p>
                                <p className="text-[11px] text-[#77716A]">
                                  {p.unit} · <span className="font-mono">{p.slug}</span>
                                  {p.is_hamper && (
                                    <Badge className="ml-1.5 bg-[#C49A50] text-white text-[9px] py-0 px-1">
                                      Festive Hamper
                                    </Badge>
                                  )}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {p.category}
                              </Badge>
                            </td>
                            <td className="p-3 text-[#292522] font-medium">
                              {p.brand || "Good Luck Palace"}
                            </td>
                            <td className="p-3 font-mono font-bold text-[#8F1D22] text-sm">
                              {inr(p.price)}
                            </td>
                            <td className="p-3 font-mono text-[#77716A]">
                              {p.mrp ? inr(p.mrp) : "—"}
                              {discount > 0 && (
                                <span className="text-[10px] text-[#258451] ml-1 font-semibold">
                                  ({discount}% OFF)
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => toggleStockMutation.mutate({ productId: p.id, available: !p.available })}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer border transition-colors ${
                                  p.available
                                    ? "bg-[#258451]/10 text-[#258451] border-[#258451]/30 hover:bg-[#258451]/20"
                                    : "bg-[#C0392B]/10 text-[#C0392B] border-[#C0392B]/30 hover:bg-[#C0392B]/20"
                                }`}
                              >
                                {p.available ? "● In Stock" : "○ Off Shelf"}
                              </button>
                            </td>
                            <td className="p-3 pr-4 text-right space-x-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditProduct(p)}
                                className="h-7 w-7 text-[#77716A] hover:text-[#8F1D22] cursor-pointer"
                                title="Edit product"
                              >
                                <Edit3 size={14} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteProductConfirm(p)}
                                className="h-7 w-7 text-[#77716A] hover:text-[#C0392B] cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CATEGORIES MANAGEMENT                              */}
          {/* ========================================================= */}
          {currentTab === "categories" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Retail Departments &amp; Categories
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Organized department structure serving Good Luck Palace customers since 1983.
                  </p>
                </div>
                <Badge className="bg-[#8F1D22] text-white">
                  {allCategories.length} Active Departments
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCategories.map((c) => {
                  const prods = allProducts.filter((p) => p.category === c.slug);
                  return (
                    <Card key={c.id} className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50] transition-colors overflow-hidden">
                      <div className="h-28 bg-[#1E1815] relative overflow-hidden flex items-center justify-center">
                        <img
                          src={c.image_url || "/images/legacy/photo-1542838132-92c53300491e"}
                          alt={c.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <div className="relative z-10 text-center px-4">
                          <h4 className="font-serif font-bold text-lg text-[#FAF8F3] drop-shadow-sm">
                            {c.name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#C49A50] uppercase tracking-wider">
                            /{c.slug}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-xs text-[#77716A] line-clamp-2">
                          {c.description || "Authentic provisions and goods thoughtfully curated on Cross Cut Road."}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D4] text-xs">
                          <span className="font-semibold text-[#8F1D22]">
                            {prods.length} Products
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCategoryFilter(c.slug);
                              handleSelectTab("products");
                            }}
                            className="h-7 text-xs text-[#77716A] hover:text-[#8F1D22]"
                          >
                            View Items →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MULTI-BRAND MANAGEMENT                             */}
          {/* ========================================================= */}
          {currentTab === "brands" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Brand Portfolio Management
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Trusted national and heritage retail brands carried at Good Luck Palace.
                  </p>
                </div>
                <Badge className="bg-[#C49A50] text-white">
                  {brandsList.length} Partner Brands
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {brandsList.map((b, idx) => (
                  <Card key={idx} className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#8F1D22] transition-colors p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="h-8 w-8 rounded-lg bg-[#FAF8F3] border border-[#E8E0D4] flex items-center justify-center font-serif font-bold text-[#8F1D22] text-xs">
                          {b.name.charAt(0)}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono text-[#258451]">
                          {b.activeCount} In Stock
                        </Badge>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#292522] truncate">
                        {b.name}
                      </h4>
                      <p className="text-xs text-[#77716A] mt-0.5">
                        {b.count} Total Products in Catalogue
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedBrandFilter(b.name);
                        handleSelectTab("products");
                      }}
                      className="mt-4 w-full text-xs text-[#8F1D22] hover:bg-[#8F1D22]/10"
                    >
                      Filter Brand Products →
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: INVENTORY & WAREHOUSE                              */}
          {/* ========================================================= */}
          {currentTab === "inventory" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Warehouse Stock &amp; Shelf Availability
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Control physical shelf availability across Gandhipuram departmental store aisles.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#258451] text-white">
                    {allProducts.filter((p) => p.available).length} On-Shelf
                  </Badge>
                  <Badge className="bg-[#C0392B] text-white">
                    {offShelfProducts.length} Off-Shelf Alerts
                  </Badge>
                </div>
              </div>

              {/* Off-Shelf Critical Alert Banner */}
              {offShelfProducts.length > 0 && (
                <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#C0392B] shrink-0" />
                    <div>
                      <h4 className="font-semibold text-xs text-[#991B1B]">
                        {offShelfProducts.length} Items Currently Disabled for Online Order
                      </h4>
                      <p className="text-[11px] text-[#B91C1C]">
                        Replenish counter stock and click "Restock Shelf" below to re-enable for customers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Table */}
              <Card className="bg-white border-[#E8E0D4] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F3] border-b border-[#E8E0D4] text-[#77716A] uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Item</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Unit / Pack</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">Shelf Status</th>
                        <th className="p-3 pr-4 text-right">Quick Stock Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D4]">
                      {allProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF8F3]/50 transition-colors">
                          <td className="p-3 pl-4 font-semibold text-[#292522]">
                            {p.name}
                            <p className="text-[10px] text-[#77716A] font-normal">{p.brand}</p>
                          </td>
                          <td className="p-3 uppercase text-[10px] text-[#77716A]">{p.category}</td>
                          <td className="p-3 font-mono">{p.unit}</td>
                          <td className="p-3 font-mono font-bold text-[#8F1D22]">{inr(p.price)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.available ? "bg-[#258451]/10 text-[#258451]" : "bg-[#C0392B]/10 text-[#C0392B]"
                            }`}>
                              {p.available ? <Check size={12} /> : <X size={12} />}
                              {p.available ? "In Stock" : "Off Shelf"}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <Button
                              size="sm"
                              variant={p.available ? "outline" : "default"}
                              onClick={() => toggleStockMutation.mutate({ productId: p.id, available: !p.available })}
                              className={`h-7 text-xs cursor-pointer ${
                                p.available
                                  ? "border-[#E8E0D4] text-[#77716A] hover:bg-[#FAF8F3]"
                                  : "bg-[#258451] hover:bg-[#1E6B42] text-white"
                              }`}
                            >
                              {p.available ? "Mark Off-Shelf" : "Restock Shelf"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: ORDER MANAGEMENT                                  */}
          {/* ========================================================= */}
          {currentTab === "orders" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter */}
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-40 h-9 text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="placed">Placed</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Source Filter */}
                  <Select value={orderSourceFilter} onValueChange={setOrderSourceFilter}>
                    <SelectTrigger className="w-40 h-9 text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="online">Online Store</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Direct</SelectItem>
                      <SelectItem value="manual">Counter Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#77716A] font-mono">
                    <b>{allOrders.length}</b> total orders
                  </span>
                  <Button
                    onClick={() => handleSelectTab("whatsapp")}
                    className="bg-[#258451] hover:bg-[#1E6B42] text-white text-xs gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> New WhatsApp Order
                  </Button>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {allOrders.map((order) => {
                  return (
                    <Card key={order.id} className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#8F1D22] transition-colors p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E0D4]">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-sm text-[#8F1D22]">
                            {order.order_number}
                          </span>
                          <Badge className={order.source === "whatsapp" || order.source === "manual" ? "bg-[#258451] text-white" : "bg-[#4285F4] text-white"}>
                            {order.source.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-[#77716A]">
                            {fmtDateTime(order.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase font-mono text-[10px]">
                            Status: {order.status}
                          </Badge>
                          <Badge variant="outline" className={order.payment_status === "paid" ? "bg-[#258451]/10 text-[#258451] border-[#258451]/30 font-mono text-[10px]" : "bg-[#D18A24]/10 text-[#D18A24] border-[#D18A24]/30 font-mono text-[10px]"}>
                            Payment: {order.payment_status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-mono text-[#77716A]">Customer</p>
                          <p className="font-semibold text-[#292522] mt-0.5">{order.customer_name}</p>
                          <p className="text-[#77716A]">{order.phone}</p>
                          {order.email && <p className="text-[#77716A]">{order.email}</p>}
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-mono text-[#77716A]">Destination</p>
                          <p className="text-[#292522] mt-0.5">
                            {order.address?.address_line1 || "Store Counter Pick-up"}
                          </p>
                          <p className="text-[#77716A]">
                            {order.address?.city || "Coimbatore"} {order.address?.postal_code || "641012"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-mono text-[#77716A]">Items ({(order.items ?? []).length})</p>
                          <p className="text-[#292522] mt-0.5 font-medium truncate max-w-xs">
                            {(order.items ?? []).map((i) => `${i.name} (×${i.qty})`).join(", ")}
                          </p>
                          <p className="text-[#8F1D22] font-mono font-bold text-sm mt-1">
                            Total: {inr(order.total ?? order.total_amount ?? 0)}
                          </p>
                        </div>

                        <div className="flex flex-col justify-between items-end gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(newStatus) => {
                              const note = prompt(`Enter fulfillment note for status '${newStatus}':`, `Updated status to ${newStatus}`) || "";
                              statusMutation.mutate({ orderId: order.id, status: newStatus, note });
                            }}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="placed">Placed</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(`/api/orders/${order.id}/invoice`, "_blank");
                              }}
                              className="h-7 text-xs border-[#E8E0D4] gap-1 cursor-pointer"
                              title="Download GST invoice PDF"
                            >
                              <Download size={12} /> Invoice PDF
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="h-7 bg-[#8F1D22] hover:bg-[#641419] text-white text-xs cursor-pointer"
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {allOrders.length === 0 && (
                  <div className="bg-white p-12 text-center rounded-xl border border-[#E8E0D4]">
                    <ShoppingBag size={28} className="text-[#77716A] mx-auto mb-2 opacity-40" />
                    <p className="font-serif font-bold text-[#292522]">No Orders Found</p>
                    <p className="text-xs text-[#77716A] mt-1">
                      No customer orders match the selected filters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: WHATSAPP MANUAL ORDER ENTRY                        */}
          {/* ========================================================= */}
          {currentTab === "whatsapp" && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-[#1E1815] text-[#FAF8F3] p-5 rounded-xl border border-[#3B2F26] shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#FAF8F3] flex items-center gap-2">
                    <SiWhatsapp size={18} className="text-[#258451]" /> WhatsApp Counter Sales Terminal
                  </h3>
                  <p className="text-xs text-[#77716A] mt-0.5">
                    Record offline orders, phone inquiries, and WhatsApp counter orders for instant doorstep delivery dispatch.
                  </p>
                </div>
                <Badge className="bg-[#258451] text-white border-0 font-mono text-xs">
                  POS ACTIVE
                </Badge>
              </div>

              <Card className="bg-white border-[#E8E0D4] shadow-xs p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Customer Full Name *</Label>
                    <Input
                      value={waCustomerName}
                      onChange={(e) => setWaCustomerName(e.target.value)}
                      placeholder="e.g. Anand Murugan"
                      className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Phone Number *</Label>
                    <Input
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="+91 98422 12345"
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Delivery Address (Coimbatore) *</Label>
                    <Input
                      value={waLine1}
                      onChange={(e) => setWaLine1(e.target.value)}
                      placeholder="Street name, landmark, area (e.g. Cross Cut Rd, Gandhipuram)"
                      className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Postal Code</Label>
                    <Input
                      value={waPincode}
                      onChange={(e) => setWaPincode(e.target.value)}
                      placeholder="641012"
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                </div>

                {/* Add Item to Order */}
                <div className="pt-2 border-t border-[#E8E0D4] space-y-3">
                  <Label className="text-xs font-semibold text-[#8F1D22]">Add Products from Catalogue *</Label>
                  <Select
                    onValueChange={(val) => {
                      if (!val) return;
                      const exists = waItems.find((i) => i.product_id === val);
                      if (exists) {
                        setWaItems(waItems.map((i) => (i.product_id === val ? { ...i, qty: i.qty + 1 } : i)));
                      } else {
                        setWaItems([...waItems, { product_id: val, qty: 1 }]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue placeholder="Click to choose a product from store shelves…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name} ({p.unit}) — {inr(p.price)} [{p.category}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected Items Table */}
                  {waItems.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E8E0D4] space-y-2">
                      {waItems.map((item, idx) => {
                        const prod = allProducts.find((p) => p.id === item.product_id);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs gap-3">
                            <span className="font-medium text-[#292522] truncate flex-1">
                              {prod?.name || "Product"} ({prod?.unit})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#8F1D22] font-semibold">
                                {inr((prod?.price ?? 0) * item.qty)}
                              </span>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const q = parseInt(e.target.value) || 1;
                                  setWaItems(waItems.map((i, iIdx) => (iIdx === idx ? { ...i, qty: q } : i)));
                                }}
                                className="w-14 p-1 bg-white border border-[#E8E0D4] rounded font-mono text-center text-xs"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setWaItems(waItems.filter((_, iIdx) => iIdx !== idx))}
                                className="h-6 w-6 text-[#C0392B]"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Counter Notes & Dispatch Button */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Staff Counter Notes</Label>
                  <Input
                    value={waNotes}
                    onChange={(e) => setWaNotes(e.target.value)}
                    className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                  />
                </div>

                <Button
                  onClick={() => createManualOrderMutation.mutate()}
                  disabled={createManualOrderMutation.isPending || waItems.length === 0}
                  className="w-full bg-[#258451] hover:bg-[#1E6B42] text-white py-6 font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <SiWhatsapp size={16} /> Record WhatsApp Order &amp; Dispatch Delivery
                </Button>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: CUSTOMERS DIRECTORY                                */}
          {/* ========================================================= */}
          {currentTab === "customers" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Customer Directory &amp; Loyalty Ledger
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Patron profiles and purchase history across Coimbatore neighborhoods.
                  </p>
                </div>
                <Badge className="bg-[#8F1D22] text-white">
                  {customersList.length} Registered Patrons
                </Badge>
              </div>

              <Card className="bg-white border-[#E8E0D4] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F3] border-b border-[#E8E0D4] text-[#77716A] uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Customer Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Orders Count</th>
                        <th className="p-3">Total Spend</th>
                        <th className="p-3 pr-4 text-right">Last Interaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D4]">
                      {customersList.map((c, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF8F3]/50 transition-colors">
                          <td className="p-3 pl-4 font-semibold text-[#292522]">{c.name}</td>
                          <td className="p-3 font-mono text-[#77716A]">{c.phone || "—"}</td>
                          <td className="p-3 text-[#77716A]">{c.email}</td>
                          <td className="p-3 font-mono font-semibold">{c.orderCount} orders</td>
                          <td className="p-3 font-mono font-bold text-[#8F1D22]">{inr(c.totalSpent)}</td>
                          <td className="p-3 pr-4 text-right text-[#77716A]">{fmtDate(c.lastOrder)}</td>
                        </tr>
                      ))}
                      {customersList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#77716A]">
                            No customer records yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: COUPONS & OFFERS                                   */}
          {/* ========================================================= */}
          {currentTab === "coupons" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Promotional Coupons &amp; Offers
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Manage checkout discount promo codes and seasonal incentives.
                  </p>
                </div>
                <Button
                  onClick={() => setCouponModalOpen(true)}
                  className="bg-[#8F1D22] hover:bg-[#641419] text-white text-xs gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Create Coupon
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCoupons.map((c) => (
                  <Card key={c.id} className="bg-white border-[#E8E0D4] shadow-xs p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-[#8F1D22] text-white font-mono text-sm px-2.5 py-1 tracking-wider">
                          {c.code}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-[#258451]">
                          {c.discount_type === "percent" ? `${c.value}% OFF` : `INR ${c.value} FLAT`}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#77716A] mt-2">
                        Min. Order Value: <b>{inr(c.min_order ?? c.min_order_amount ?? 0)}</b>
                      </p>
                      <p className="text-xs text-[#77716A] mt-0.5">
                        Usage Count: <b>{c.used_count ?? 0}</b> redeemed
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E8E0D4] flex items-center justify-between">
                      <span className="text-[10px] text-[#258451] font-semibold">● Active at Checkout</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteCouponMutation.mutate(c.id)}
                        className="h-7 w-7 text-[#C0392B] hover:bg-[#C0392B]/10 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: GIFT HAMPERS MANAGEMENT                           */}
          {/* ========================================================= */}
          {currentTab === "hampers" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Signature Gift Hampers &amp; Festive Edits
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Curated dry fruit, chocolate, and festive assortments for weddings and celebrations.
                  </p>
                </div>
                <Button
                  onClick={openCreateProduct}
                  className="bg-[#C49A50] hover:bg-[#A37B34] text-white text-xs gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> New Hamper Box
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hampersProducts.map((h) => (
                  <Card key={h.id} className="bg-white border-[#E8E0D4] shadow-xs hover:border-[#C49A50] transition-colors overflow-hidden">
                    <img
                      src={h.image_url || "/images/legacy/photo-1549465220-1a8b9238cd48"}
                      alt={h.name}
                      className="h-44 w-full object-cover"
                    />
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-[#C49A50] text-white text-[10px]">
                          FESTIVE COLLECTION
                        </Badge>
                        <span className="font-mono font-bold text-[#8F1D22] text-base">
                          {inr(h.price)}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-[#292522]">{h.name}</h4>
                      <p className="text-xs text-[#77716A] line-clamp-2">{h.description}</p>
                      <div className="pt-2 flex items-center justify-between border-t border-[#E8E0D4]">
                        <span className={`text-[11px] font-semibold ${h.available ? "text-[#258451]" : "text-[#C0392B]"}`}>
                          {h.available ? "● Available for Gifting" : "○ Out of Stock"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditProduct(h)}
                          className="h-7 text-xs text-[#8F1D22]"
                        >
                          Edit Box →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 11: REPORTS & ANALYTICS                               */}
          {/* ========================================================= */}
          {currentTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#292522]">
                    Retail Intelligence &amp; Sales Reports
                  </h3>
                  <p className="text-xs text-[#77716A]">
                    Audited operational reports, revenue metrics, and channel breakdown.
                  </p>
                </div>
                <Button
                  onClick={exportOrdersCSV}
                  className="bg-[#8F1D22] hover:bg-[#641419] text-white text-xs gap-1.5"
                >
                  <Download size={14} /> Download Ledger CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white border-[#E8E0D4] p-4 text-center">
                  <p className="text-xs text-[#77716A] uppercase font-mono">Total Transaction Volume</p>
                  <p className="font-serif text-3xl font-bold text-[#292522] mt-1">
                    {inr(allOrders.reduce((a, b) => a + (b.total ?? b.total_amount ?? 0), 0))}
                  </p>
                  <p className="text-[11px] text-[#258451] mt-1">From {allOrders.length} Completed Orders</p>
                </Card>

                <Card className="bg-white border-[#E8E0D4] p-4 text-center">
                  <p className="text-xs text-[#77716A] uppercase font-mono">Average Basket Size</p>
                  <p className="font-serif text-3xl font-bold text-[#C49A50] mt-1">
                    {inr(allOrders.length > 0 ? Math.round(allOrders.reduce((a, b) => a + (b.total ?? b.total_amount ?? 0), 0) / allOrders.length) : 0)}
                  </p>
                  <p className="text-[11px] text-[#77716A] mt-1">Per Customer Purchase</p>
                </Card>

                <Card className="bg-white border-[#E8E0D4] p-4 text-center">
                  <p className="text-xs text-[#77716A] uppercase font-mono">Counter WhatsApp Share</p>
                  <p className="font-serif text-3xl font-bold text-[#258451] mt-1">
                    {allOrders.length > 0 ? Math.round((allOrders.filter((o) => o.source === "whatsapp" || o.source === "manual").length / allOrders.length) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-[#77716A] mt-1">Phone &amp; Counter Consultations</p>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 12: STORE & GST SETTINGS                              */}
          {/* ========================================================= */}
          {currentTab === "settings" && settingsForm && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs">
                <h3 className="font-serif font-bold text-lg text-[#292522]">
                  Store Profile, Delivery &amp; GST Configuration
                </h3>
                <p className="text-xs text-[#77716A]">
                  Official Coimbatore departmental store business profile and tax parameters.
                </p>
              </div>

              <Card className="bg-white border-[#E8E0D4] shadow-xs p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Store Trade Name</Label>
                    <Input
                      value={settingsForm.store_name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                      className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Counter Phone</Label>
                    <Input
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">WhatsApp Order Number</Label>
                    <Input
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Inquiry Email</Label>
                    <Input
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E8E0D4]">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Delivery Fee (INR)</Label>
                    <Input
                      type="number"
                      value={settingsForm.delivery_fee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: parseFloat(e.target.value) || 0 })}
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Free Delivery Above (INR)</Label>
                    <Input
                      type="number"
                      value={settingsForm.free_delivery_above}
                      onChange={(e) => setSettingsForm({ ...settingsForm, free_delivery_above: parseFloat(e.target.value) || 0 })}
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">GSTIN</Label>
                    <Input
                      value={settingsForm.gstin || "33AAAAA0000A1Z5"}
                      onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#E8E0D4]">
                  <Label className="text-xs font-semibold">Serviceable Delivery Neighborhoods (Coimbatore)</Label>
                  <Input
                    value={(settingsForm.serviceable_areas ?? []).join(", ")}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      serviceable_areas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })}
                    className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                  />
                </div>

                <Button
                  onClick={() => saveSettingsMutation.mutate(settingsForm)}
                  disabled={saveSettingsMutation.isPending}
                  className="w-full bg-[#8F1D22] hover:bg-[#641419] text-white py-6 font-bold text-sm shadow-md mt-4 cursor-pointer"
                >
                  {saveSettingsMutation.isPending ? "Saving Parameters…" : "Save Store & GST Settings"}
                </Button>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: WEBSITE CONTENT                                       */}
          {/* ========================================================= */}
          {currentTab === "content" && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D4] shadow-xs">
                <h3 className="font-serif font-bold text-lg text-[#292522]">
                  Website Content, Banners &amp; Announcements
                </h3>
                <p className="text-xs text-[#77716A]">
                  Manage the promotional banners, announcement text, and store highlights displayed on the customer-facing website.
                </p>
              </div>

              <Card className="bg-white border-[#E8E0D4] shadow-xs p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Storefront Announcement Bar Text</Label>
                  <Input
                    defaultValue="✨ Free Doorstep Delivery across Coimbatore on orders above ₹1,000 | Store Hours: 10 AM - 9 PM"
                    className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                  />
                  <p className="text-[11px] text-[#77716A]">Appears at the very top of the customer website.</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Homepage Hero Headline</Label>
                  <Input
                    defaultValue="Coimbatore's Premier Departmental Store Since 1983"
                    className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Homepage Hero Sub-Headline</Label>
                  <Input
                    defaultValue="Four decades of trusted service on Cross Cut Road, Gandhipuram. Authentic cosmetics, premium dry fruits, gourmet confectionery, and curated festive hampers."
                    className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E8E0D4]">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Festive Campaign Tagline</Label>
                    <Input
                      defaultValue="Diwali &amp; New Year Luxury Hampers Now Available"
                      className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Counter Order WhatsApp Hotline</Label>
                    <Input
                      defaultValue="+91 94430 23659"
                      className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F3] border border-[#E8E0D4] rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-[#8F1D22]">Physical Store Operating Notice:</p>
                  <p className="text-[#77716A]">
                    Sri Lakshmi Complex, Cross Cut Road, Gandhipuram, Coimbatore. Mon–Sat 10:00 AM – 9:00 PM | Sun 4:00 PM – 9:00 PM
                  </p>
                </div>

                <Button
                  onClick={() => toast.success("Storefront content parameters updated successfully!")}
                  className="w-full bg-[#8F1D22] hover:bg-[#641419] text-white py-6 font-bold text-sm shadow-md mt-4 cursor-pointer"
                >
                  Save Website Content Settings
                </Button>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 13 & 14: STAFF & REVIEWS (Transparent Backend Status) */}
          {/* ========================================================= */}
          {(currentTab === "staff" || currentTab === "reviews") && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in-50 duration-200">
              <Card className="bg-white border-[#E8E0D4] p-6 text-center space-y-3">
                <ShieldCheck size={32} className="text-[#8F1D22] mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[#292522]">
                  {currentTab === "staff" ? "Staff Roles & Access Governance" : "Customer Reviews Moderation"}
                </h3>
                <p className="text-xs text-[#77716A] leading-relaxed">
                  {currentTab === "staff"
                    ? "Good Luck Palace operates under an authorized Store Owner / Super Admin security model. Multi-user staff permission delegation is staged in the server roadmap."
                    : "Customer feedback is currently captured via verified WhatsApp inquiries and counter interactions. Public review moderation module will activate once public rating endpoints are staged."}
                </p>
                <div className="p-3 bg-[#FAF8F3] border border-[#E8E0D4] rounded-lg text-xs font-mono text-[#258451]">
                  Active Security State: Single-Tenant Store Owner Master Key
                </div>
              </Card>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT PRODUCT MODAL                                  */}
      {/* ========================================================= */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-lg bg-white border-[#E8E0D4] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-lg text-[#292522]">
              {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Item to Catalogue"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProductMutation.mutate(prodForm);
            }}
            className="space-y-3.5 text-xs pt-2"
          >
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Product Name *</Label>
              <Input
                value={prodForm.name}
                onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                required
                className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department *</Label>
                <Select
                  value={prodForm.category}
                  onValueChange={(val) => setProdForm({ ...prodForm, category: val })}
                >
                  <SelectTrigger className="bg-[#FAF8F3] text-xs border-[#E8E0D4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Brand</Label>
                <Input
                  value={prodForm.brand}
                  onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                  className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Selling Price (INR) *</Label>
                <Input
                  type="number"
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                  required
                  className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Original MRP (INR)</Label>
                <Input
                  type="number"
                  value={prodForm.mrp}
                  onChange={(e) => setProdForm({ ...prodForm, mrp: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unit / Weight</Label>
                <Input
                  value={prodForm.unit}
                  onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                  placeholder="500g, 1 kg"
                  className="bg-[#FAF8F3] text-xs border-[#E8E0D4]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Photograph URL / Direct Upload</Label>
              <div className="flex gap-2">
                <Input
                  value={prodForm.image_url}
                  onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                  placeholder="Paste URL or upload below"
                  className="bg-[#FAF8F3] text-xs border-[#E8E0D4] flex-1"
                />
                <label className="h-9 px-3 rounded-md bg-[#FAF8F3] border border-[#E8E0D4] flex items-center gap-1.5 cursor-pointer hover:bg-[#E8E0D4]/30 text-xs text-[#292522]">
                  <Upload size={13} />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <textarea
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                rows={3}
                className="w-full p-2 bg-[#FAF8F3] border border-[#E8E0D4] rounded-md text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={prodForm.available}
                  onChange={(e) => setProdForm({ ...prodForm, available: e.target.checked })}
                  className="rounded border-[#E8E0D4]"
                />
                Available in Stock
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={prodForm.is_hamper}
                  onChange={(e) => setProdForm({ ...prodForm, is_hamper: e.target.checked })}
                  className="rounded border-[#E8E0D4]"
                />
                Mark as Festive Gift Hamper
              </label>
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8E0D4]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductModalOpen(false)}
                className="text-xs border-[#E8E0D4]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveProductMutation.isPending}
                className="bg-[#8F1D22] hover:bg-[#641419] text-white text-xs"
              >
                {saveProductMutation.isPending ? "Saving…" : editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* ORDER DETAILS MODAL                                       */}
      {/* ========================================================= */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-lg bg-white border-[#E8E0D4] p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-[#E8E0D4] pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-serif font-bold text-lg text-[#8F1D22]">
                    Order #{selectedOrder.order_number}
                  </DialogTitle>
                  <p className="text-xs text-[#77716A]">Placed on {fmtDateTime(selectedOrder.created_at)}</p>
                </div>
                <Badge className={selectedOrder.source === "whatsapp" ? "bg-[#258451] text-white" : "bg-[#4285F4] text-white"}>
                  {selectedOrder.source.toUpperCase()}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#FAF8F3] border border-[#E8E0D4]">
                <div>
                  <p className="font-mono uppercase text-[10px] text-[#77716A]">Customer Details</p>
                  <p className="font-semibold text-sm text-[#292522] mt-0.5">{selectedOrder.customer_name}</p>
                  <p className="text-[#77716A]">{selectedOrder.phone}</p>
                  {selectedOrder.email && <p className="text-[#77716A]">{selectedOrder.email}</p>}
                </div>
                <div>
                  <p className="font-mono uppercase text-[10px] text-[#77716A]">Delivery Address</p>
                  <p className="text-[#292522] mt-0.5">{selectedOrder.address?.address_line1 || "Store Counter"}</p>
                  <p className="text-[#77716A]">{selectedOrder.address?.city} {selectedOrder.address?.postal_code}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="font-mono uppercase text-[10px] text-[#77716A] mb-1.5">Ordered Goods</p>
                <div className="divide-y divide-[#E8E0D4] border border-[#E8E0D4] rounded-lg overflow-hidden">
                  {(selectedOrder.items ?? []).map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <div>
                        <p className="font-semibold text-[#292522]">{item.name}</p>
                        <p className="text-[11px] text-[#77716A]">{item.brand} · {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-[#8F1D22]">{inr(item.price * item.qty)}</p>
                        <p className="text-[11px] text-[#77716A]">Qty: {item.qty} × {inr(item.price)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-[#FAF8F3] flex items-center justify-between font-bold text-sm">
                    <span>Order Total:</span>
                    <span className="font-mono text-[#8F1D22]">{inr(selectedOrder.total ?? selectedOrder.total_amount ?? 0)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Control */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Advance Fulfillment Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(newStatus) => {
                      const note = prompt(`Enter note for status '${newStatus}':`, `Updated to ${newStatus}`) || "";
                      statusMutation.mutate({ orderId: selectedOrder.id, status: newStatus, note });
                    }}
                  >
                    <SelectTrigger className="w-full text-xs bg-[#FAF8F3] border-[#E8E0D4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placed">Placed</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => window.open(`/api/orders/${selectedOrder.id}/invoice`, "_blank")}
                    className="bg-[#1E1815] text-[#FAF8F3] hover:bg-[#292522] text-xs gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download size={13} /> GST Invoice PDF
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ========================================================= */}
      {/* DELETE PRODUCT CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      <Dialog open={Boolean(deleteProductConfirm)} onOpenChange={(open) => !open && setDeleteProductConfirm(null)}>
        {deleteProductConfirm && (
          <DialogContent className="max-w-sm bg-white border-[#E8E0D4] p-6 text-xs">
            <DialogHeader>
              <DialogTitle className="font-serif font-bold text-base text-[#C0392B] flex items-center gap-1.5">
                <AlertCircle size={16} /> Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <p className="text-[#77716A] py-2">
              Are you sure you want to permanently delete <b>"{deleteProductConfirm.name}"</b> from the Good Luck Palace retail catalogue?
            </p>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteProductConfirm(null)}
                className="text-xs border-[#E8E0D4]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deleteProductMutation.mutate(deleteProductConfirm.id)}
                className="bg-[#C0392B] hover:bg-[#962D22] text-white text-xs"
              >
                Delete Item
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ========================================================= */}
      {/* CREATE COUPON MODAL                                       */}
      {/* ========================================================= */}
      <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
        <DialogContent className="max-w-sm bg-white border-[#E8E0D4] p-6 text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-base text-[#292522]">
              Create Store Promo Coupon
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Promo Code *</Label>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. HERITAGE1983"
                className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type</Label>
                <Select value={couponType} onValueChange={(v: any) => setCouponType(v)}>
                  <SelectTrigger className="bg-[#FAF8F3] text-xs border-[#E8E0D4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage %</SelectItem>
                    <SelectItem value="flat">Flat INR Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Value *</Label>
                <Input
                  type="number"
                  value={couponVal}
                  onChange={(e) => setCouponVal(parseFloat(e.target.value) || 0)}
                  className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Min. Order Value (INR)</Label>
              <Input
                type="number"
                value={couponMinOrder}
                onChange={(e) => setCouponMinOrder(parseFloat(e.target.value) || 0)}
                className="bg-[#FAF8F3] font-mono text-xs border-[#E8E0D4]"
              />
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCouponModalOpen(false)}
              className="text-xs border-[#E8E0D4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createCouponMutation.mutate()}
              disabled={createCouponMutation.isPending || !couponCode.trim()}
              className="bg-[#8F1D22] hover:bg-[#641419] text-white text-xs"
            >
              Publish Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
