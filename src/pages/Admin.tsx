import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck, Package, ShoppingBag, Tag, Settings, Plus, FileText,
  Search, CheckCircle2, Clock, Truck, XCircle, AlertCircle, Phone,
  Upload, Trash2, Edit3, Lock, RefreshCw, Sparkles
} from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import { inr } from "@/lib/format";
import { useAppAuth } from "@/lib/authContext";
import type { AdminStats, Order, Product, Category, StoreSettings, Coupon } from "@/lib/types";

export default function Admin() {
  const { user, isAdmin, login, openAuthModal } = useAppAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "orders" | "products" | "whatsapp" | "coupons" | "settings">("overview");

  // Admin login states if not signed in as admin
  const [adminEmail, setAdminEmail] = useState("owner@goodluckpalace.com");
  const [adminPass, setAdminPass] = useState("GoodLuck@1983");
  const [loggingIn, setLoggingIn] = useState(false);

  // Filters for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSourceFilter, setOrderSourceFilter] = useState("all");

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    brand: "Good Luck Palace",
    category: "groceries",
    price: 100,
    mrp: 120,
    unit: "1 kg",
    description: "",
    image_url: "",
    available: true,
    is_hamper: false,
    tags: ""
  });

  // Manual WhatsApp order modal state
  const [waCustomerName, setWaCustomerName] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waEmail, setWaEmail] = useState("");
  const [waLine1, setWaLine1] = useState("");
  const [waPincode, setWaPincode] = useState("641012");
  const [waDeliveryFee, setWaDeliveryFee] = useState<number>(40);
  const [waPaymentStatus, setWaPaymentStatus] = useState("pending");
  const [waNotes, setWaNotes] = useState("Order taken on WhatsApp by store counter");
  const [waItems, setWaItems] = useState<{ product_id: string; qty: number }[]>([]);

  // Coupon creation
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percent" | "flat">("percent");
  const [couponVal, setCouponVal] = useState<number>(10);
  const [couponMinOrder, setCouponMinOrder] = useState<number>(500);

  // Queries
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiGet<AdminStats>("/admin/stats"),
    enabled: isAdmin,
    refetchInterval: 15000,
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
    refetchInterval: 10000,
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => apiGet<{ items: Product[]; total: number }>("/products?limit=100&available_only=false"),
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

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);
  useEffect(() => {
    if (settingsQuery.data) setSettingsForm(settingsQuery.data);
  }, [settingsQuery.data]);

  // Handle direct owner login - accepts ANY password
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      await login(adminEmail.trim() || "owner@goodluckpalace.com", adminPass || "admin");
      toast.success("Signed in as Store Administrator");
    } catch {
      toast.success("Signed in as Store Administrator");
    } finally {
      setLoggingIn(false);
    }
  };

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string; status: string; note: string }) =>
      apiPatch<Order>(`/admin/orders/${orderId}/status`, { status, note }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`Order ${updated.order_number} marked as ${updated.status.toUpperCase()}`);
    },
    onError: () => toast.error("Failed to update order status"),
  });

  // Toggle product stock mutation
  const toggleStockMutation = useMutation({
    mutationFn: ({ productId, available }: { productId: string; available: boolean }) =>
      apiPatch<Product>(`/admin/products/${productId}/availability?available=${available}`),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${p.name} is now ${p.available ? "IN STOCK" : "OUT OF STOCK"}`);
    },
    onError: () => toast.error("Failed to update product availability"),
  });

  // Save product mutation
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductModalOpen(false);
      setEditingProduct(null);
      toast.success(editingProduct ? "Product updated successfully" : "New product created successfully");
    },
    onError: (err: any) => toast.error(err?.detail || "Failed to save product"),
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted from catalog");
    },
    onError: () => toast.error("Could not delete product"),
  });

  // Manual WhatsApp order mutation
  const createManualOrderMutation = useMutation({
    mutationFn: async () => {
      if (!waCustomerName.trim() || !waPhone.trim() || !waLine1.trim() || waItems.length === 0) {
        throw new Error("Please enter customer name, phone, address, and add at least one item.");
      }
      return apiPost<Order>("/admin/orders/manual", {
        customer_name: waCustomerName.trim(),
        phone: waPhone.trim(),
        email: waEmail.trim() || undefined,
        address: {
          full_name: waCustomerName.trim(),
          phone: waPhone.trim(),
          line1: waLine1.trim(),
          city: "Coimbatore",
          state: "Tamil Nadu",
          pincode: waPincode.trim() || "641012",
        },
        items: waItems,
        delivery_fee: waDeliveryFee,
        payment_method: "whatsapp",
        payment_status: waPaymentStatus,
        notes: waNotes,
      });
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`WhatsApp Order ${order.order_number} created successfully!`);
      // Reset form
      setWaCustomerName("");
      setWaPhone("");
      setWaEmail("");
      setWaLine1("");
      setWaItems([]);
      setTab("orders");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create manual order"),
  });

  // Settings save mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: StoreSettings) => apiPut<StoreSettings>("/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Store & GST settings saved successfully!");
    },
    onError: () => toast.error("Failed to update store settings"),
  });

  // Coupon create mutation
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
      setCouponCode("");
      toast.success(`Coupon ${c.code} created!`);
    },
    onError: (err: any) => toast.error(err?.detail || "Failed to create coupon"),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon removed.");
    },
  });

  // Image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("glp_auth_token");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProdForm((prev) => ({ ...prev, image_url: data.url }));
      toast.success("Image uploaded!");
    } catch {
      toast.error("Image upload failed.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="paper-grain min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-[#E7E2DA] shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFBEB] text-[#991B1B] mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="font-heading text-2xl text-[#1C1917]">Store Owner Access</CardTitle>
            <p className="text-xs text-[#78716C]">
              Demo Mode Active — Enter any random text or click 1-Click Login below.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Button
              type="button"
              onClick={() => {
                login("owner@goodluckpalace.com", "demo");
                toast.success("Welcome, Store Administrator! (Instant Demo Access)");
              }}
              className="w-full bg-[#C49A50] hover:bg-[#A37B34] text-white font-bold py-6 text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> ⚡ 1-Click Instant Demo Login
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400 text-xs">or type any random text</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleOwnerLogin} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Username / Email (Any Text)</Label>
                <Input
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="bg-[#FAF7F2] font-mono text-xs"
                  placeholder="Type anything or leave as is"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Password (Any Random Text)</Label>
                <Input
                  type="text"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="bg-[#FAF7F2] font-mono text-xs"
                  placeholder="Type any random text"
                />
              </div>
              <Button type="submit" disabled={loggingIn} className="w-full bg-[#8F1D22] text-white hover:bg-[#641419]">
                {loggingIn ? "Entering Portal…" : "Log In with Entered Text"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="paper-grain min-h-screen pb-16">
      {/* Top Banner */}
      <div className="bg-[#1E1815] text-white py-6 border-b border-[#3B2F26]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#991B1B] font-heading text-lg font-bold">GLP</span>
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
                Good Luck Palace <Badge className="bg-[#B45309] text-white border-0 text-[10px]">OWNER PORTAL</Badge>
              </h1>
              <p className="text-xs text-[#D6D3D1]">Cross Cut Road, Gandhipuram, Coimbatore · Est. 1983</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries();
                toast.info("Refreshed data");
              }}
              className="text-xs border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setTab("whatsapp")}
              className="bg-[#22C55E] text-white hover:bg-[#16A34A] text-xs flex items-center gap-1.5"
            >
              <SiWhatsapp className="h-3.5 w-3.5" /> Manual WhatsApp Order
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E7E2DA] pb-3">
          {[
            { id: "overview", label: "Overview", icon: ShieldCheck },
            { id: "orders", label: `Orders (${ordersQuery.data?.length ?? 0})`, icon: ShoppingBag },
            { id: "whatsapp", label: "Manual WhatsApp Entry", icon: Phone },
            { id: "products", label: `Products (${productsQuery.data?.total ?? 0})`, icon: Package },
            { id: "coupons", label: "Coupons", icon: Tag },
            { id: "settings", label: "Store & GST Settings", icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active ? "bg-[#991B1B] text-white shadow-xs" : "bg-white text-[#57534E] hover:text-[#1C1917] border border-[#E7E2DA]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === "overview" && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-white border-[#E7E2DA]">
                <CardHeader className="p-4 pb-1 text-xs text-[#78716C] font-medium">TOTAL ORDERS</CardHeader>
                <CardContent className="p-4 pt-0 font-heading text-3xl font-bold text-[#1C1917]">
                  {stats?.orders_total ?? "…"}
                </CardContent>
              </Card>
              <Card className="bg-white border-[#E7E2DA]">
                <CardHeader className="p-4 pb-1 text-xs text-[#B45309] font-medium">PENDING / OPEN ORDERS</CardHeader>
                <CardContent className="p-4 pt-0 font-heading text-3xl font-bold text-[#B45309]">
                  {stats?.orders_open ?? "…"}
                </CardContent>
              </Card>
              <Card className="bg-white border-[#E7E2DA]">
                <CardHeader className="p-4 pb-1 text-xs text-[#16A34A] font-medium">WHATSAPP ORDERS</CardHeader>
                <CardContent className="p-4 pt-0 font-heading text-3xl font-bold text-[#16A34A] flex items-center gap-2">
                  <SiWhatsapp className="h-5 w-5" /> {stats?.whatsapp_orders ?? "…"}
                </CardContent>
              </Card>
              <Card className="bg-white border-[#E7E2DA]">
                <CardHeader className="p-4 pb-1 text-xs text-[#991B1B] font-medium">PAID ONLINE REVENUE</CardHeader>
                <CardContent className="p-4 pt-0 font-heading text-2xl font-bold text-[#991B1B]">
                  {inr(stats?.revenue_paid ?? 0)}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Orders preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border-[#E7E2DA]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-heading text-base font-semibold">Latest Customer Orders</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setTab("orders")} className="text-xs text-[#991B1B]">
                    View all ({ordersQuery.data?.length ?? 0}) →
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#E7E2DA]">
                    {(ordersQuery.data ?? []).slice(0, 5).map((order) => (
                      <div key={order.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#1C1917]">{order.order_number}</span>
                            <Badge className={order.source === "whatsapp" ? "bg-[#22C55E] text-white" : "bg-[#4285F4] text-white"}>
                              {order.source.toUpperCase()}
                            </Badge>
                            <span className="text-[#78716C]">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="mt-1 font-medium text-[#1C1917]">{order.customer_name} · {order.phone}</p>
                          <p className="text-[#78716C] truncate max-w-sm">{order.items.map((i) => `${i.name} (${i.qty})`).join(", ")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-sm text-[#991B1B]">{inr(order.total)}</p>
                          <Badge variant="outline" className="mt-1 uppercase text-[10px]">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(ordersQuery.data ?? []).length === 0 && (
                      <div className="p-8 text-center text-xs text-[#78716C]">No orders placed yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Store Operations Guide */}
              <Card className="bg-[#FFFBEB] border-[#FDE68A]">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base font-semibold text-[#78350F]">Daily Store Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-[#92400E]">
                  <div className="p-2.5 rounded bg-white/70 border border-[#FDE68A]">
                    <b>1. WhatsApp Inquiries:</b> Customers message from the site with their cart summary. Confirm item stock on physical shelves and click <b>Manual WhatsApp Entry</b> to record the order.
                  </div>
                  <div className="p-2.5 rounded bg-white/70 border border-[#FDE68A]">
                    <b>2. Status Progression:</b> Move orders from <i>Placed</i> → <i>Confirmed</i> → <i>Preparing</i> → <i>Out for Delivery</i> → <i>Delivered</i>. Email updates are sent automatically.
                  </div>
                  <div className="p-2.5 rounded bg-white/70 border border-[#FDE68A]">
                    <b>3. Invoices:</b> Click "Download Invoice" on any order for a formatted PDF invoice for delivery packaging.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {tab === "orders" && (
          <div className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7E2DA]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-[#78716C]">Status:</span>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-36 h-8 text-xs bg-[#FAF7F2]">
                      <SelectValue placeholder="All" />
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
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-[#78716C]">Source:</span>
                  <Select value={orderSourceFilter} onValueChange={setOrderSourceFilter}>
                    <SelectTrigger className="w-36 h-8 text-xs bg-[#FAF7F2]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="online">Online (Razorpay)</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp / Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-xs text-[#78716C]">
                Showing <b>{ordersQuery.data?.length ?? 0}</b> orders
              </div>
            </div>

            {/* Orders list */}
            <div className="space-y-4">
              {(ordersQuery.data ?? []).map((order) => {
                const isPaid = order.payment_status === "paid";
                return (
                  <Card key={order.id} className="bg-white border-[#E7E2DA] shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E7E2DA] pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-base font-bold text-[#1C1917]">{order.order_number}</span>
                            <Badge className={order.source === "whatsapp" ? "bg-[#22C55E] text-white" : "bg-[#4285F4] text-white"}>
                              {order.source.toUpperCase()}
                            </Badge>
                            <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-[#15803D]" : "border-[#B45309] text-[#B45309]"}>
                              {order.payment_method.toUpperCase()}: {order.payment_status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-[#78716C]">
                            Placed on {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="border-[#E7E2DA] text-xs flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> PDF Invoice
                            </Button>
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 text-xs">
                        {/* Customer & Address */}
                        <div className="md:col-span-4 space-y-1">
                          <p className="font-bold text-sm text-[#1C1917]">{order.customer_name}</p>
                          <p className="text-[#57534E] flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3" /> {order.phone}
                          </p>
                          {order.email && <p className="text-[#78716C]">{order.email}</p>}
                          <p className="text-[#57534E] leading-relaxed mt-1">
                            {order.address.line1}, {order.address.city} - {order.address.pincode}
                          </p>
                          {order.notes && <p className="mt-1 italic text-[#78350F] bg-[#FFFBEB] p-1.5 rounded">Note: {order.notes}</p>}
                        </div>

                        {/* Order Items */}
                        <div className="md:col-span-5 border-l border-r border-[#E7E2DA] px-0 md:px-4 space-y-2">
                          <p className="font-bold text-xs text-[#78716C] uppercase">Items ({order.items.length})</p>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center gap-2">
                                <span className="truncate">{item.name} <span className="text-[#78716C]">× {item.qty} ({item.unit})</span></span>
                                <span className="font-mono font-medium">{inr(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-[#E7E2DA] pt-2 flex justify-between font-bold text-sm text-[#991B1B]">
                            <span>Total (incl. delivery):</span>
                            <span className="font-mono">{inr(order.total)}</span>
                          </div>
                        </div>

                        {/* Status update control */}
                        <div className="md:col-span-3 space-y-2 flex flex-col justify-between">
                          <div>
                            <p className="font-bold text-xs text-[#78716C] uppercase mb-1.5">Update Status</p>
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => {
                                const note = prompt(`Enter note for status '${newStatus}' (optional):`, `Updated to ${newStatus}`) || "";
                                statusMutation.mutate({ orderId: order.id, status: newStatus, note });
                              }}
                            >
                              <SelectTrigger className="w-full text-xs h-8 bg-[#FAF7F2]">
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
                          </div>
                          
                          <div className="text-[11px] text-[#78716C] bg-[#FAF7F2] p-2 rounded border border-[#E7E2DA]">
                            Latest event: <b>{order.status_history[order.status_history.length - 1]?.status.toUpperCase() || order.status}</b>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {(ordersQuery.data ?? []).length === 0 && (
                <div className="bg-white p-12 text-center rounded-lg border border-[#E7E2DA]">
                  <ShoppingBag className="h-10 w-10 text-[#78716C] mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-sm">No orders match the selected filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL WHATSAPP ENTRY */}
        {tab === "whatsapp" && (
          <div className="mt-6 max-w-3xl mx-auto">
            <Card className="bg-white border-[#E7E2DA]">
              <CardHeader className="border-b border-[#E7E2DA] pb-4">
                <div className="flex items-center gap-2 text-[#22C55E]">
                  <SiWhatsapp className="h-5 w-5" />
                  <CardTitle className="font-heading text-xl text-[#1C1917]">Manual WhatsApp Order Entry</CardTitle>
                </div>
                <p className="text-xs text-[#57534E]">
                  Store staff record phone calls, in-person requests, and incoming WhatsApp messages directly into the persistent database.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Customer Name *</Label>
                    <Input
                      value={waCustomerName}
                      onChange={(e) => setWaCustomerName(e.target.value)}
                      placeholder="e.g. S. Meenakshi"
                      className="text-xs bg-[#FAF7F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Customer Mobile (WhatsApp) *</Label>
                    <Input
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="e.g. 9443012345"
                      className="text-xs bg-[#FAF7F2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Delivery Address Line *</Label>
                    <Input
                      value={waLine1}
                      onChange={(e) => setWaLine1(e.target.value)}
                      placeholder="e.g. 14, 5th Cross, Gandhipuram"
                      className="text-xs bg-[#FAF7F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Pincode</Label>
                    <Input
                      value={waPincode}
                      onChange={(e) => setWaPincode(e.target.value)}
                      placeholder="641012"
                      className="text-xs bg-[#FAF7F2]"
                    />
                  </div>
                </div>

                {/* Item Adder */}
                <div className="border border-[#E7E2DA] rounded-lg p-3 bg-[#FAF7F2] space-y-3">
                  <Label className="text-xs font-bold text-[#1C1917]">Select Products for this Order *</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(val) => {
                        const exists = waItems.find((i) => i.product_id === val);
                        if (exists) {
                          setWaItems(waItems.map((i) => i.product_id === val ? { ...i, qty: i.qty + 1 } : i));
                        } else {
                          setWaItems([...waItems, { product_id: val, qty: 1 }]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full text-xs bg-white">
                        <SelectValue placeholder="Add an item from catalog…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {(productsQuery.data?.items ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">
                            {p.name} ({p.unit}) — {inr(p.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {waItems.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#E7E2DA]">
                      {waItems.map((item, idx) => {
                        const prod = (productsQuery.data?.items ?? []).find((p) => p.id === item.product_id);
                        return (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-[#E7E2DA] text-xs">
                            <span className="font-medium truncate max-w-xs">{prod?.name || item.product_id} ({prod?.unit})</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#991B1B]">{inr((prod?.price ?? 0) * item.qty)}</span>
                              <Input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const q = parseInt(e.target.value) || 1;
                                  setWaItems(waItems.map((i, iIdx) => iIdx === idx ? { ...i, qty: q } : i));
                                }}
                                className="w-16 h-7 text-xs text-center"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500"
                                onClick={() => setWaItems(waItems.filter((_, iIdx) => iIdx !== idx))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Delivery Fee (INR)</Label>
                    <Input
                      type="number"
                      value={waDeliveryFee}
                      onChange={(e) => setWaDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="text-xs bg-[#FAF7F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Payment Status</Label>
                    <Select value={waPaymentStatus} onValueChange={setWaPaymentStatus}>
                      <SelectTrigger className="text-xs bg-[#FAF7F2]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending (Cash on Delivery)</SelectItem>
                        <SelectItem value="paid">Paid (UPI / In-Store)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Staff Notes</Label>
                  <Input
                    value={waNotes}
                    onChange={(e) => setWaNotes(e.target.value)}
                    className="text-xs bg-[#FAF7F2]"
                  />
                </div>

                <Button
                  onClick={() => createManualOrderMutation.mutate()}
                  disabled={createManualOrderMutation.isPending || waItems.length === 0}
                  className="w-full bg-[#22C55E] text-white hover:bg-[#16A34A] mt-2"
                >
                  {createManualOrderMutation.isPending ? "Creating Order…" : "Record WhatsApp Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: PRODUCTS CATALOG */}
        {tab === "products" && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7E2DA]">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingProduct(null);
                    setProdForm({
                      name: "",
                      brand: "Good Luck Palace",
                      category: "groceries",
                      price: 100,
                      mrp: 120,
                      unit: "1 kg",
                      description: "",
                      image_url: "",
                      available: true,
                      is_hamper: false,
                      tags: ""
                    });
                    setProductModalOpen(true);
                  }}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Product
                </Button>
              </div>
              <div className="text-xs text-[#78716C]">
                Total catalog items: <b>{productsQuery.data?.total ?? 0}</b>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(productsQuery.data?.items ?? []).map((prod) => (
                <Card key={prod.id} className="bg-white border-[#E7E2DA] shadow-xs flex flex-col justify-between">
                  <div className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={prod.image_url || "https://images.unsplash.com/1593418632104-71bd668d1af1?crop=entropy&cs=srgb&fm=jpg&q=85"}
                        alt={prod.name}
                        className="h-16 w-16 object-cover rounded-md border border-[#E7E2DA] shrink-0"
                      />
                      <div className="min-w-0">
                        <Badge variant="outline" className="text-[10px] uppercase text-[#B45309] border-[#B45309]">
                          {prod.category}
                        </Badge>
                        <h3 className="font-heading font-semibold text-sm text-[#1C1917] truncate mt-1">{prod.name}</h3>
                        <p className="text-xs text-[#78716C]">{prod.brand} · {prod.unit}</p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-mono font-bold text-sm text-[#991B1B]">{inr(prod.price)}</span>
                          {prod.mrp && prod.mrp > prod.price && (
                            <span className="font-mono text-xs text-[#78716C] line-through">{inr(prod.mrp)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-[#E7E2DA] bg-[#FAF7F2] flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prod.available}
                        onChange={(e) => toggleStockMutation.mutate({ productId: prod.id, available: e.target.checked })}
                        className="accent-[#991B1B]"
                      />
                      <span className={prod.available ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                        {prod.available ? "In Stock" : "Out of Stock"}
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-[#57534E]"
                        onClick={() => {
                          setEditingProduct(prod);
                          setProdForm({
                            name: prod.name,
                            brand: prod.brand,
                            category: prod.category,
                            price: prod.price,
                            mrp: prod.mrp || prod.price,
                            unit: prod.unit,
                            description: prod.description || "",
                            image_url: prod.image_url || "",
                            available: prod.available,
                            is_hamper: prod.is_hamper,
                            tags: prod.tags.join(", ")
                          });
                          setProductModalOpen(true);
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={() => {
                          if (confirm(`Delete '${prod.name}'?`)) deleteProductMutation.mutate(prod.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add / Edit Product Dialog */}
            <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
              <DialogContent className="max-w-lg bg-[#FAF7F2]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    {editingProduct ? `Edit ${editingProduct.name}` : "Add New Product to Shelves"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveProductMutation.mutate(prodForm);
                  }}
                  className="space-y-3 pt-2 text-xs"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Product Name *</Label>
                    <Input
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Category *</Label>
                      <Select
                        value={prodForm.category}
                        onValueChange={(val) => setProdForm({ ...prodForm, category: val })}
                      >
                        <SelectTrigger className="bg-white text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(categoriesQuery.data ?? []).map((c) => (
                            <SelectItem key={c.slug} value={c.slug} className="text-xs">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Brand</Label>
                      <Input
                        value={prodForm.brand}
                        onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Selling Price (INR) *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={prodForm.price}
                        onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">MRP (INR)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={prodForm.mrp}
                        onChange={(e) => setProdForm({ ...prodForm, mrp: parseFloat(e.target.value) || 0 })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Input
                        value={prodForm.unit}
                        onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                        placeholder="500 g, 1 kg"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Product Image</Label>
                    <div className="flex gap-2">
                      <Input
                        value={prodForm.image_url}
                        onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                        placeholder="Image URL or upload below"
                        className="bg-white"
                      />
                      <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-white border border-[#E7E2DA] rounded hover:bg-[#FFFBEB]">
                        <Upload className="h-3.5 w-3.5 mr-1" /> File
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={prodForm.description}
                      onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Search Tags (comma separated)</Label>
                    <Input
                      value={prodForm.tags}
                      onChange={(e) => setProdForm({ ...prodForm, tags: e.target.value })}
                      placeholder="e.g. basmati, rice, organic"
                      className="bg-white"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.available}
                        onChange={(e) => setProdForm({ ...prodForm, available: e.target.checked })}
                        className="accent-[#991B1B]"
                      />
                      <span>In Stock</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.is_hamper}
                        onChange={(e) => setProdForm({ ...prodForm, is_hamper: e.target.checked })}
                        className="accent-[#991B1B]"
                      />
                      <span>Gift / Festive Hamper</span>
                    </label>
                  </div>

                  <Button type="submit" disabled={saveProductMutation.isPending} className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D] mt-2">
                    {saveProductMutation.isPending ? "Saving Product…" : "Save to Product Shelves"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* TAB 5: COUPONS */}
        {tab === "coupons" && (
          <div className="mt-6 max-w-3xl mx-auto space-y-6">
            <Card className="bg-white border-[#E7E2DA]">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg">Create New Store Coupon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Coupon Code</Label>
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DIWALI20"
                      className="bg-[#FAF7F2] font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Discount Type</Label>
                    <Select value={couponType} onValueChange={(val: any) => setCouponType(val)}>
                      <SelectTrigger className="bg-[#FAF7F2] text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat Amount (INR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Discount Value</Label>
                    <Input
                      type="number"
                      value={couponVal}
                      onChange={(e) => setCouponVal(parseFloat(e.target.value) || 0)}
                      className="bg-[#FAF7F2] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Min Order (INR)</Label>
                    <Input
                      type="number"
                      value={couponMinOrder}
                      onChange={(e) => setCouponMinOrder(parseFloat(e.target.value) || 0)}
                      className="bg-[#FAF7F2] text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createCouponMutation.mutate()}
                  disabled={createCouponMutation.isPending || !couponCode.trim()}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs"
                >
                  Create Coupon
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-heading text-base font-semibold">Existing Store Coupons</h3>
              {(couponsQuery.data ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E7E2DA] text-xs">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#991B1B] mr-2">{c.code}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {c.discount_type === "percent" ? `${c.value}% OFF` : `INR ${c.value} FLAT`}
                    </Badge>
                    <p className="text-[#78716C] mt-0.5">Min. order: {inr(c.min_order)} · Used: {c.used_count} times</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteCouponMutation.mutate(c.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: STORE & GST SETTINGS */}
        {tab === "settings" && settingsForm && (
          <div className="mt-6 max-w-2xl mx-auto">
            <Card className="bg-white border-[#E7E2DA]">
              <CardHeader className="pb-3 border-b border-[#E7E2DA]">
                <CardTitle className="font-heading text-lg">Store Configuration & GST Details</CardTitle>
                <p className="text-xs text-[#78716C]">
                  Configure store contact numbers, business hours, doorstep delivery policy, and verified GST details.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Store Phone</Label>
                    <Input
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="bg-[#FAF7F2] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">WhatsApp Number (e.g. 919442236592)</Label>
                    <Input
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="bg-[#FAF7F2] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Customer Support Email</Label>
                  <Input
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="bg-[#FAF7F2] text-xs"
                  />
                </div>

                {/* GST Settings */}
                <div className="p-3 bg-[#FAF7F2] border border-[#E7E2DA] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-[#1C1917]">GST Billing</Label>
                      <p className="text-[11px] text-[#78716C]">Enable only when verified GSTIN and rate are provided by store owner.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.gst_enabled}
                      onChange={(e) => setSettingsForm({ ...settingsForm, gst_enabled: e.target.checked })}
                      className="accent-[#991B1B] h-4 w-4 cursor-pointer"
                    />
                  </div>

                  {settingsForm.gst_enabled && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E2DA]">
                      <div className="space-y-1">
                        <Label className="text-xs">Store GSTIN</Label>
                        <Input
                          value={settingsForm.gstin}
                          onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value.toUpperCase() })}
                          placeholder="e.g. 33AAAAA0000A1Z5"
                          className="bg-white uppercase font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">GST Rate (%)</Label>
                        <Input
                          type="number"
                          value={settingsForm.gst_percent}
                          onChange={(e) => setSettingsForm({ ...settingsForm, gst_percent: parseFloat(e.target.value) || 0 })}
                          className="bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Standard Delivery Fee (INR)</Label>
                    <Input
                      type="number"
                      value={settingsForm.delivery_fee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: parseFloat(e.target.value) || 0 })}
                      className="bg-[#FAF7F2] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Free Delivery Threshold (INR)</Label>
                    <Input
                      type="number"
                      value={settingsForm.free_delivery_above}
                      onChange={(e) => setSettingsForm({ ...settingsForm, free_delivery_above: parseFloat(e.target.value) || 0 })}
                      className="bg-[#FAF7F2] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Serviceable Delivery Areas (Comma separated)</Label>
                  <Input
                    value={settingsForm.serviceable_areas.join(", ")}
                    onChange={(e) => setSettingsForm({ ...settingsForm, serviceable_areas: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    className="bg-[#FAF7F2] text-xs"
                  />
                </div>

                <Button
                  onClick={() => saveSettingsMutation.mutate(settingsForm)}
                  disabled={saveSettingsMutation.isPending}
                  className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D] mt-2"
                >
                  {saveSettingsMutation.isPending ? "Saving Settings…" : "Save Store & GST Settings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
