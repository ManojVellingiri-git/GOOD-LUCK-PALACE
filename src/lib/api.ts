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
