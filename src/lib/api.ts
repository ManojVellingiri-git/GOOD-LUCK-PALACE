import { getAuthToken } from "./authToken";
import mockData from "./mockData.json";

const BASE = (import.meta.env.VITE_API_URL as string) || "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  detail(): string {
    if (this.body && typeof this.body === "object" && "detail" in this.body) {
      const d = (this.body as { detail: unknown }).detail;
      if (typeof d === "string") return d;
    }
    return this.message;
  }
}

type JsonBody = unknown;

function getMockFallback<T>(path: string): T | null {
  const [cleanPath, search] = path.split("?");
  const searchParams = new URLSearchParams(search || "");

  if (cleanPath === "/settings") {
    return mockData.settings as T;
  }
  if (cleanPath === "/categories") {
    return mockData.categories as T;
  }
  if (cleanPath === "/products") {
    let items = [...(mockData.products.items as any[])];
    const category = searchParams.get("category");
    if (category) {
      items = items.filter((p) => p.category === category);
    }
    const q = searchParams.get("q");
    if (q) {
      const query = q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }
    const limit = parseInt(searchParams.get("limit") || "60", 10);
    return {
      items: items.slice(0, limit),
      total: items.length,
      page: 1,
      pages: Math.ceil(items.length / limit) || 1,
    } as T;
  }
  if (cleanPath.startsWith("/products/")) {
    const slug = cleanPath.replace("/products/", "");
    const found = (mockData.products.items as any[]).find((p) => p.slug === slug || p.id === slug);
    if (found) return found as T;
  }
  if (cleanPath === "/admin/stats") {
    return {
      orders_total: 28,
      orders_open: 5,
      whatsapp_orders: 12,
      revenue_paid: 48950,
      products_total: (mockData.products.items as any[]).length,
      products_off_shelf: 2,
      customers_total: 142,
      coupons_active: 3,
    } as T;
  }
  if (cleanPath.startsWith("/admin/orders")) {
    return [
      {
        id: "ord_101",
        order_number: "GLP-2026-0881",
        user_id: "usr_1",
        customer_name: "Senthil Kumar",
        email: "senthil@example.com",
        phone: "+91 98422 11223",
        address: { address_line1: "Cross Cut Rd", city: "Coimbatore", postal_code: "641012", full_name: "Senthil Kumar", phone: "9842211223" },
        items: [
          { product_id: "prod_1", slug: "kashmir-mamra-almonds", name: "Kashmiri Mamra Almonds", brand: "Good Luck Reserve", unit: "500g", image_url: null, price: 1450, qty: 1 }
        ],
        subtotal: 1450,
        discount: 100,
        delivery_fee: 0,
        gst_amount: 72,
        total_amount: 1422,
        total: 1422,
        payment_method: "upi",
        payment_status: "paid",
        status: "processing",
        source: "web",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "ord_102",
        order_number: "GLP-WA-0419",
        user_id: null,
        customer_name: "Ananya Ramesh",
        email: "ananya@example.com",
        phone: "+91 94433 88112",
        address: { address_line1: "RS Puram", city: "Coimbatore", postal_code: "641002", full_name: "Ananya Ramesh", phone: "9443388112" },
        items: [
          { product_id: "prod_2", slug: "deluxe-festive-hamper", name: "Royal Heritage Festive Hamper", brand: "Good Luck Signature", unit: "1 box", image_url: null, price: 3200, qty: 1 }
        ],
        subtotal: 3200,
        discount: 0,
        delivery_fee: 0,
        gst_amount: 160,
        total_amount: 3360,
        total: 3360,
        payment_method: "cash_on_delivery",
        payment_status: "pending",
        status: "pending",
        source: "whatsapp",
        created_at: new Date(Date.now() - 7200000).toISOString(),
      }
    ] as T;
  }
  if (cleanPath === "/admin/coupons") {
    return [
      { id: "cpn_1", code: "HERITAGE1983", discount_type: "flat", value: 150, min_order_amount: 1000, active: true },
      { id: "cpn_2", code: "FESTIVE10", discount_type: "percent", value: 10, min_order_amount: 1500, active: true },
    ] as T;
  }
  if (cleanPath === "/admin/settings") {
    return mockData.settings as T;
  }
  return null;
}

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      // If 404 or backend unavailable, try mock for GET
      if (method === "GET") {
        const fallback = getMockFallback<T>(path);
        if (fallback !== null) return fallback;
      }
      const errBody = await res.json().catch(() => null);
      throw new ApiError(res.status, errBody);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (method === "GET") {
      const fallback = getMockFallback<T>(path);
      if (fallback !== null) return fallback;
    }
    throw err;
  }
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) =>
  request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
