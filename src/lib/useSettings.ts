import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { StoreSettings } from "@/lib/types";

// Fallback keeps every page rendering (static-preview rule) even with no backend.
export const FALLBACK_SETTINGS: StoreSettings = {
  store_name: "Good Luck Palace",
  tagline: "Coimbatore's Cherished Departmental Store Since 1983",
  address_lines: ["Shop No. 45, Sri Lakshmi Complex, Cross Cut Road", "Opp. Ramraj Textiles, Gandhipuram, Coimbatore", "Tamil Nadu 641012"],
  phone: "+91 422 223 6592",
  whatsapp_number: "919442236592",
  email: "",
  hours: ["Mon – Sat: 10:00 AM – 9:00 PM", "Sunday: 4:00 PM – 9:00 PM"],
  gst_enabled: false,
  gstin: "",
  gst_percent: 0,
  delivery_fee: 40,
  free_delivery_above: 999,
  serviceable_areas: ["Gandhipuram", "RS Puram", "Saibaba Colony", "Peelamedu"],
};

export function useSettings() {
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<StoreSettings>("/settings"),
    staleTime: 60_000,
    retry: 1,
  });
  return { settings: q.data ?? FALLBACK_SETTINGS, isLoading: q.isLoading };
}
