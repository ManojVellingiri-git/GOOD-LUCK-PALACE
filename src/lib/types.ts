// Hand-written mirrors of the backend's Pydantic models

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  seo_title: string;
  seo_description: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  price: number;
  mrp: number | null;
  unit: string;
  image_url: string | null;
  available: boolean;
  is_hamper: boolean;
  tags: string[];
  created_at: string;
}

export interface ProductPage {
  items: Product[];
  total: number;
  total_amount?: number;
  page: number;
  pages: number;
}

export interface DeliveryAddress {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface SavedAddress extends DeliveryAddress {
  id: string;
  label: string;
}

export type SavedAddressOut = SavedAddress;

export interface UserOut {
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "customer";
  addresses: SavedAddressOut[];
}

export interface OrderItem {
  product_id: string;
  slug: string;
  name: string;
  brand: string;
  unit: string;
  image_url: string | null;
  price: number;
  qty: number;
}

export interface StatusEvent {
  status: string;
  note: string;
  at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  address: DeliveryAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  delivery_fee: number;
  gst_amount?: number;
  total: number;
  total_amount?: number;
  payment_method: "razorpay" | "whatsapp";
  payment_status: "pending" | "paid" | "failed";
  source: "online" | "whatsapp" | "manual";
  status: "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  status_history: StatusEvent[];
  razorpay_order_id: string | null;
  invoice_number: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "flat";
  value: number;
  min_order: number;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
  categories: string[];
  created_at: string;
}

export interface CouponValidation {
  valid: boolean;
  code?: string;
  discount: number;
  message: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  address_lines: string[];
  phone: string;
  whatsapp_number: string;
  email: string;
  hours: string[];
  gst_enabled: boolean;
  gstin: string;
  gst_percent: number;
  delivery_fee: number;
  free_delivery_above: number;
  serviceable_areas: string[];
}

export interface AdminStats {
  orders_total: number;
  orders_open: number;
  whatsapp_orders: number;
  revenue_paid: number;
  products_total: number;
  products_off_shelf: number;
  customers_total: number;
  coupons_active: number;
}

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  brand: string;
  unit: string;
  image_url: string | null;
  price: number;
  qty: number;
  available?: boolean;
}

export interface CartResponse {
  items: CartItem[];
}

export interface PaymentConfig {
  enabled: boolean;
  key_id: string;
}

export interface RazorpayOrderResponse {
  key_id: string;
  amount: number;
  currency: string;
  razorpay_order_id: string;
  order_number: string;
  store_name: string;
  prefill_name: string;
  prefill_email: string;
  prefill_contact: string;
}

export type RazorpayOrder = RazorpayOrderResponse;

export interface UploadResponse {
  url: string;
}
