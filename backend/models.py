import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from .database import Base

def gen_uuid():
    return str(uuid.uuid4())

def now_utc():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True) # nullable for oauth
    role = Column(String, default="customer") # "admin", "staff", "customer"
    created_at = Column(DateTime(timezone=True), default=now_utc)

class Address(Base):
    __tablename__ = "addresses"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, index=True, nullable=False)
    label = Column(String, default="Home")
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    line1 = Column(String, nullable=False)
    line2 = Column(String, default="")
    city = Column(String, default="Coimbatore")
    state = Column(String, default="Tamil Nadu")
    pincode = Column(String, nullable=False)
    landmark = Column(String, default="")

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=gen_uuid)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    image_url = Column(String, nullable=True)
    seo_title = Column(String, default="")
    seo_description = Column(String, default="")

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=gen_uuid)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, default="Good Luck Palace")
    description = Column(Text, default="")
    category = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=True)
    unit = Column(String, default="1 unit")
    image_url = Column(String, nullable=True)
    available = Column(Boolean, default=True)
    is_hamper = Column(Boolean, default=False)
    tags = Column(Text, default="[]") # JSON array as string
    created_at = Column(DateTime(timezone=True), default=now_utc)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String, primary_key=True, default=gen_uuid)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_type = Column(String, default="percent") # "percent" or "flat"
    value = Column(Float, nullable=False)
    min_order = Column(Float, default=0.0)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    categories = Column(Text, default="[]") # JSON array
    created_at = Column(DateTime(timezone=True), default=now_utc)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=gen_uuid)
    order_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=True)
    customer_name = Column(String, nullable=False)
    email = Column(String, default="")
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=False) # JSON object
    items = Column(Text, nullable=False) # JSON array of OrderItem
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    coupon_code = Column(String, nullable=True)
    delivery_fee = Column(Float, default=40.0)
    gst_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    payment_method = Column(String, default="whatsapp") # "razorpay" | "whatsapp"
    payment_status = Column(String, default="pending") # "pending" | "paid" | "failed"
    source = Column(String, default="online") # "online" | "whatsapp" | "manual"
    status = Column(String, default="placed") # "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
    status_history = Column(Text, default="[]") # JSON array
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, default=1)
    store_name = Column(String, default="Good Luck Palace")
    tagline = Column(String, default="Coimbatore's Cherished Departmental Store Since 1983")
    address_lines = Column(Text, default='["Shop No. 45, Sri Lakshmi Complex, Cross Cut Road", "Opp. Ramraj Textiles, Gandhipuram, Coimbatore", "Tamil Nadu 641012, India"]')
    phone = Column(String, default="+91 422 223 6592")
    whatsapp_number = Column(String, default="919442236592")
    email = Column(String, default="orders@goodluckpalace.com")
    hours = Column(Text, default='["Mon – Sat: 10:00 AM – 9:00 PM", "Sunday: 4:00 PM – 9:00 PM"]')
    gst_enabled = Column(Boolean, default=False)
    gstin = Column(String, default="")
    gst_percent = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=40.0)
    free_delivery_above = Column(Float, default=999.0)
    serviceable_areas = Column(Text, default='["Gandhipuram", "RS Puram", "Saibaba Colony", "Peelamedu", "R.S. Puram", "Townhall", "Ukkadam", "Ganapathy"]')

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String, primary_key=True, default=gen_uuid)
    event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(Text, default="{}")
    status = Column(String, default="processed") # "processed" | "duplicate" | "failed"
    created_at = Column(DateTime(timezone=True), default=now_utc)

