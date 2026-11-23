from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class GoogleAuthRequest(BaseModel):
    credential: str
    name: Optional[str] = None
    email: Optional[str] = None

class AddressSchema(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str = "Coimbatore"
    state: str = "Tamil Nadu"
    pincode: str
    landmark: Optional[str] = ""

class SavedAddressOut(AddressSchema):
    id: str
    label: str

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    addresses: List[SavedAddressOut] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class CategoryOut(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    image_url: Optional[str] = None
    seo_title: str
    seo_description: str

class ProductOut(BaseModel):
    id: str
    slug: str
    name: str
    brand: str
    description: str
    category: str
    price: float
    mrp: Optional[float] = None
    unit: str
    image_url: Optional[str] = None
    available: bool
    is_hamper: bool
    tags: List[str] = []
    created_at: str

class ProductCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    brand: str = "Good Luck Palace"
    description: str = ""
    category: str
    price: float
    mrp: Optional[float] = None
    unit: str = "1 unit"
    image_url: Optional[str] = None
    available: bool = True
    is_hamper: bool = False
    tags: List[str] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    available: Optional[bool] = None
    is_hamper: Optional[bool] = None
    tags: Optional[List[str]] = None

class ProductPageOut(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    pages: int

class CouponOut(BaseModel):
    id: str
    code: str
    discount_type: str
    value: float
    min_order: float
    expires_at: Optional[str] = None
    usage_limit: Optional[int] = None
    used_count: int
    active: bool
    categories: List[str] = []
    created_at: str

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percent"
    value: float
    min_order: float = 0.0
    expires_at: Optional[datetime] = None
    usage_limit: Optional[int] = None
    categories: List[str] = []

class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float
    category: Optional[str] = None

class CouponValidation(BaseModel):
    valid: bool
    code: Optional[str] = None
    discount: float = 0.0
    message: str

class StoreSettingsOut(BaseModel):
    store_name: str
    tagline: str
    address_lines: List[str]
    phone: str
    whatsapp_number: str
    email: str
    hours: List[str]
    gst_enabled: bool
    gstin: str
    gst_percent: float
    delivery_fee: float
    free_delivery_above: float
    serviceable_areas: List[str]

class StoreSettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    tagline: Optional[str] = None
    address_lines: Optional[List[str]] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    hours: Optional[List[str]] = None
    gst_enabled: Optional[bool] = None
    gstin: Optional[str] = None
    gst_percent: Optional[float] = None
    delivery_fee: Optional[float] = None
    free_delivery_above: Optional[float] = None
    serviceable_areas: Optional[List[str]] = None

class OrderItemInput(BaseModel):
    product_id: str
    qty: int = 1

class OrderItemOut(BaseModel):
    product_id: str
    slug: str
    name: str
    brand: str
    unit: str
    image_url: Optional[str] = None
    price: float
    qty: int

class StatusEvent(BaseModel):
    status: str
    note: str
    at: str

class OrderCreate(BaseModel):
    items: List[OrderItemInput]
    address: AddressSchema
    coupon_code: Optional[str] = None
    payment_method: str = "whatsapp" # "razorpay" | "whatsapp"
    notes: Optional[str] = ""
    save_address: bool = False

class ManualOrderCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = ""
    address: AddressSchema
    items: List[OrderItemInput]
    payment_method: str = "whatsapp"
    payment_status: str = "pending"
    delivery_fee: Optional[float] = None
    notes: Optional[str] = "Manual WhatsApp order entry by staff"

class OrderStatusUpdate(BaseModel):
    status: str # "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
    note: Optional[str] = ""

class OrderOut(BaseModel):
    id: str
    order_number: str
    user_id: Optional[str] = None
    customer_name: str
    email: str
    phone: str
    address: AddressSchema
    items: List[OrderItemOut]
    subtotal: float
    discount: float
    coupon_code: Optional[str] = None
    delivery_fee: float
    gst_amount: float = 0.0
    total: float
    payment_method: str
    payment_status: str
    source: str
    status: str
    status_history: List[StatusEvent] = []
    razorpay_order_id: Optional[str] = None
    invoice_number: Optional[str] = None
    notes: str = ""
    created_at: str
    updated_at: str

class AdminStats(BaseModel):
    orders_total: int
    orders_open: int
    whatsapp_orders: int
    revenue_paid: float
    products_total: int
    products_off_shelf: int
    customers_total: int
    coupons_active: int

class PaymentConfig(BaseModel):
    enabled: bool
    key_id: str

class RazorpayOrderResponse(BaseModel):
    key_id: str
    amount: int
    currency: str = "INR"
    razorpay_order_id: str
    order_number: str
    store_name: str
    prefill_name: str
    prefill_email: str
    prefill_contact: str

class RazorpayVerifyRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
