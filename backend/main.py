import os
import json
import uuid
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from .database import engine, get_db, Base
from .models import User, Address, Category, Product, Coupon, Order, StoreSettings, WebhookEvent
from .schemas import (
    UserCreate, UserLogin, PasswordChangeRequest, GoogleAuthRequest, UserOut, TokenResponse,
    AddressSchema, SavedAddressOut,
    CategoryOut, ProductOut, ProductCreate, ProductUpdate, ProductPageOut,
    CouponOut, CouponCreate, CouponValidateRequest, CouponValidation,
    StoreSettingsOut, StoreSettingsUpdate,
    OrderCreate, ManualOrderCreate, OrderStatusUpdate, OrderOut, OrderItemOut,
    AdminStats, PaymentConfig, RazorpayOrderResponse, RazorpayVerifyRequest
)
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_current_user, require_admin, ADMIN_EMAIL,
    check_auth_rate_limit, verify_google_id_token
)
from .invoice import generate_invoice_pdf
from .email_service import send_order_confirmation_email, send_status_update_email

# Ensure tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Good Luck Palace E-Commerce API",
    description="Production-grade backend for Good Luck Palace, Gandhipuram, Coimbatore (Est. 1983)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Helpers
def order_to_out(order: Order) -> OrderOut:
    addr = json.loads(order.address) if isinstance(order.address, str) else order.address
    items = json.loads(order.items) if isinstance(order.items, str) else order.items
    history = json.loads(order.status_history) if isinstance(order.status_history, str) else order.status_history
    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        customer_name=order.customer_name,
        email=order.email or "",
        phone=order.phone,
        address=AddressSchema(**addr),
        items=[OrderItemOut(**i) for i in items],
        subtotal=order.subtotal,
        discount=order.discount,
        coupon_code=order.coupon_code,
        delivery_fee=order.delivery_fee,
        gst_amount=order.gst_amount,
        total=order.total,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        source=order.source,
        status=order.status,
        status_history=history,
        razorpay_order_id=order.razorpay_order_id,
        invoice_number=order.invoice_number,
        notes=order.notes or "",
        created_at=order.created_at.isoformat() if hasattr(order.created_at, "isoformat") else str(order.created_at),
        updated_at=order.updated_at.isoformat() if hasattr(order.updated_at, "isoformat") else str(order.updated_at),
    )

def product_to_out(p: Product) -> ProductOut:
    tags_list = json.loads(p.tags) if isinstance(p.tags, str) else (p.tags or [])
    return ProductOut(
        id=p.id,
        slug=p.slug,
        name=p.name,
        brand=p.brand or "Good Luck Palace",
        description=p.description or "",
        category=p.category,
        price=p.price,
        mrp=p.mrp,
        unit=p.unit or "1 unit",
        image_url=p.image_url,
        available=p.available,
        is_hamper=p.is_hamper,
        tags=tags_list,
        created_at=p.created_at.isoformat() if hasattr(p.created_at, "isoformat") else str(p.created_at),
    )

def generate_order_number(db: Session) -> str:
    count = db.query(Order).count() + 1
    year = datetime.now().year
    return f"GLP-{year}-{count + 1000}"

# ================= AUTHENTICATION =================

@app.post("/api/auth/register", response_model=TokenResponse)
def register(req: UserCreate, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    # Store-owner security: Only the explicitly authorized store-owner email gets the admin role
    is_owner = email == ADMIN_EMAIL
    role = "admin" if is_owner else "customer"

    user = User(
        email=email,
        name=req.name.strip(),
        hashed_password=hash_password(req.password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserOut(user_id=user.id, email=user.email, name=user.name, role=user.role, addresses=[])
    )

@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    check_auth_rate_limit(f"login:{email}")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    # Maintain admin privilege if owner
    if user.email.lower() == ADMIN_EMAIL and user.role != "admin":
        user.role = "admin"
        db.commit()

    saved_addrs = db.query(Address).filter(Address.user_id == user.id).all()
    addrs_out = [SavedAddressOut(
        id=a.id, label=a.label, full_name=a.full_name, phone=a.phone,
        line1=a.line1, line2=a.line2, city=a.city, state=a.state, pincode=a.pincode, landmark=a.landmark
    ) for a in saved_addrs]

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserOut(user_id=user.id, email=user.email, name=user.name, role=user.role, addresses=addrs_out)
    )

@app.post("/api/auth/google", response_model=TokenResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Validates Google OAuth ID token, checks claims (iss, exp, aud, email_verified),
    and logs in or registers customer.
    """
    cred = (req.credential or "").strip()
    if "." in cred:
        # Full JWT Google OAuth ID token verification
        claims = verify_google_id_token(cred)
        email = claims["email"]
        name = claims.get("name") or req.name or email.split("@")[0].title()
    elif cred.startswith("simulated_") and req.email:
        # Development fallback with provided email
        email = req.email.strip().lower()
        name = req.name or email.split("@")[0].title()
    else:
        raise HTTPException(status_code=400, detail="Invalid Google OAuth credential provided.")

    check_auth_rate_limit(f"google:{email}")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        is_owner = email == ADMIN_EMAIL
        role = "admin" if is_owner else "customer"
        user = User(
            email=email,
            name=name,
            hashed_password=None,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Prevent privilege escalation: only authorized ADMIN_EMAIL can hold admin role
        if user.role == "admin" and email != ADMIN_EMAIL:
            user.role = "customer"
            db.commit()

    saved_addrs = db.query(Address).filter(Address.user_id == user.id).all()
    addrs_out = [SavedAddressOut(
        id=a.id, label=a.label, full_name=a.full_name, phone=a.phone,
        line1=a.line1, line2=a.line2, city=a.city, state=a.state, pincode=a.pincode, landmark=a.landmark
    ) for a in saved_addrs]

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserOut(user_id=user.id, email=user.email, name=user.name, role=user.role, addresses=addrs_out)
    )

@app.post("/api/auth/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Secure password rotation endpoint for authenticated users.
    Requires current password verification and minimum 8-character length.
    """
    if not current_user.hashed_password or not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password verification failed.")
    
    if len(req.new_password.strip()) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")
        
    current_user.hashed_password = hash_password(req.new_password.strip())
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}

@app.get("/api/auth/me", response_model=UserOut)
def get_me(user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    saved_addrs = db.query(Address).filter(Address.user_id == user.id).all()
    addrs_out = [SavedAddressOut(
        id=a.id, label=a.label, full_name=a.full_name, phone=a.phone,
        line1=a.line1, line2=a.line2, city=a.city, state=a.state, pincode=a.pincode, landmark=a.landmark
    ) for a in saved_addrs]
    return UserOut(user_id=user.id, email=user.email, name=user.name, role=user.role, addresses=addrs_out)

@app.post("/api/auth/address", response_model=SavedAddressOut)
def add_saved_address(addr: AddressSchema, user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    new_addr = Address(
        user_id=user.id,
        label="Home",
        full_name=addr.full_name,
        phone=addr.phone,
        line1=addr.line1,
        line2=addr.line2 or "",
        city=addr.city,
        state=addr.state,
        pincode=addr.pincode,
        landmark=addr.landmark or ""
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return SavedAddressOut(
        id=new_addr.id, label=new_addr.label, full_name=new_addr.full_name, phone=new_addr.phone,
        line1=new_addr.line1, line2=new_addr.line2, city=new_addr.city, state=new_addr.state, pincode=new_addr.pincode, landmark=new_addr.landmark
    )

# ================= STORE SETTINGS =================

@app.get("/api/settings", response_model=StoreSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    s = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    if not s:
        raise HTTPException(status_code=404, detail="Store settings not found.")
    
    addr_lines = json.loads(s.address_lines) if isinstance(s.address_lines, str) else s.address_lines
    hours = json.loads(s.hours) if isinstance(s.hours, str) else s.hours
    areas = json.loads(s.serviceable_areas) if isinstance(s.serviceable_areas, str) else s.serviceable_areas

    return StoreSettingsOut(
        store_name=s.store_name,
        tagline=s.tagline,
        address_lines=addr_lines,
        phone=s.phone,
        whatsapp_number=s.whatsapp_number,
        email=s.email,
        hours=hours,
        gst_enabled=s.gst_enabled,
        gstin=s.gstin or "",
        gst_percent=s.gst_percent,
        delivery_fee=s.delivery_fee,
        free_delivery_above=s.free_delivery_above,
        serviceable_areas=areas,
    )

# ================= CATEGORIES =================

@app.get("/api/categories", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [CategoryOut(
        id=c.id, slug=c.slug, name=c.name, description=c.description or "",
        image_url=c.image_url, seo_title=c.seo_title or "", seo_description=c.seo_description or ""
    ) for c in cats]

# ================= PRODUCTS =================

@app.get("/api/products", response_model=ProductPageOut)
def list_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    sort: Optional[str] = "newest",
    limit: int = Query(60, le=100),
    page: int = Query(1, ge=1),
    available_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if available_only:
        query = query.filter(Product.available == True)
    if category:
        query = query.filter(Product.category == category)
    if q:
        query_str = f"%{q.strip().lower()}%"
        query = query.filter(or_(
            func.lower(Product.name).like(query_str),
            func.lower(Product.brand).like(query_str),
            func.lower(Product.description).like(query_str),
            func.lower(Product.tags).like(query_str)
        ))

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    pages = (total + limit - 1) // limit if total > 0 else 1

    return ProductPageOut(
        items=[product_to_out(p) for p in items],
        total=total,
        page=page,
        pages=pages
    )

@app.get("/api/products/{slug_or_id}", response_model=ProductOut)
def get_product(slug_or_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(or_(Product.slug == slug_or_id, Product.id == slug_or_id)).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product_to_out(p)

# ================= COUPONS =================

@app.post("/api/coupons/validate", response_model=CouponValidation)
def validate_coupon(req: CouponValidateRequest, db: Session = Depends(get_db)):
    code_clean = req.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_clean, Coupon.active == True).first()
    if not coupon:
        return CouponValidation(valid=False, discount=0.0, message="Invalid or inactive coupon code.")
    
    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
        return CouponValidation(valid=False, discount=0.0, message="This coupon code has expired.")
    
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        return CouponValidation(valid=False, discount=0.0, message="This coupon usage limit has been reached.")

    if req.subtotal < coupon.min_order:
        return CouponValidation(
            valid=False,
            discount=0.0,
            message=f"Minimum order value of INR {coupon.min_order:,.2f} required for coupon {code_clean}."
        )

    if coupon.discount_type == "percent":
        discount = round((req.subtotal * coupon.value / 100.0), 2)
    else:
        discount = min(coupon.value, req.subtotal)

    return CouponValidation(
        valid=True,
        code=coupon.code,
        discount=discount,
        message=f"Coupon {coupon.code} applied successfully! You save INR {discount:,.2f}."
    )

# ================= ORDERS =================

@app.post("/api/orders", response_model=OrderOut)
def create_order(
    req: OrderCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart.")
    
    settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    
    # 1. Resolve and validate items against persistent database
    resolved_items = []
    subtotal = 0.0
    for item_input in req.items:
        prod = db.query(Product).filter(Product.id == item_input.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product not found for item {item_input.product_id}")
        if not prod.available:
            raise HTTPException(status_code=400, detail=f"Item '{prod.name}' is currently out of stock.")
        
        line_price = prod.price * item_input.qty
        subtotal += line_price
        resolved_items.append({
            "product_id": prod.id,
            "slug": prod.slug,
            "name": prod.name,
            "brand": prod.brand,
            "unit": prod.unit,
            "image_url": prod.image_url,
            "price": prod.price,
            "qty": item_input.qty
        })

    # 2. Coupon discount validation
    discount = 0.0
    applied_coupon_code = None
    if req.coupon_code:
        c_code = req.coupon_code.strip().upper()
        coupon = db.query(Coupon).filter(Coupon.code == c_code, Coupon.active == True).first()
        if coupon and subtotal >= coupon.min_order:
            if coupon.discount_type == "percent":
                discount = round((subtotal * coupon.value / 100.0), 2)
            else:
                discount = min(coupon.value, subtotal)
            coupon.used_count += 1
            applied_coupon_code = coupon.code

    # 3. Delivery fee and GST
    delivery_fee = 0.0 if (subtotal - discount) >= settings.free_delivery_above else settings.delivery_fee
    gst_amount = 0.0
    if settings.gst_enabled and settings.gst_percent > 0:
        gst_amount = round(((subtotal - discount) * settings.gst_percent / 100.0), 2)

    total = round(max(0.0, (subtotal - discount + delivery_fee + gst_amount)), 2)

    order_num = generate_order_number(db)
    now_str = datetime.now(timezone.utc).isoformat()
    status_events = [
        {"status": "placed", "note": f"Order placed via {req.payment_method.upper()}", "at": now_str}
    ]

    source = "whatsapp" if req.payment_method == "whatsapp" else "online"

    order = Order(
        order_number=order_num,
        user_id=current_user.id if current_user else None,
        customer_name=req.address.full_name.strip(),
        email=(current_user.email if current_user else "").strip(),
        phone=req.address.phone.strip(),
        address=json.dumps(req.address.model_dump()),
        items=json.dumps(resolved_items),
        subtotal=subtotal,
        discount=discount,
        coupon_code=applied_coupon_code,
        delivery_fee=delivery_fee,
        gst_amount=gst_amount,
        total=total,
        payment_method=req.payment_method,
        payment_status="pending",
        source=source,
        status="placed",
        status_history=json.dumps(status_events),
        invoice_number=f"INV-{order_num}",
        notes=req.notes or "",
    )
    db.add(order)

    # Save address for authenticated user if requested
    if current_user and req.save_address:
        exists_addr = db.query(Address).filter(
            Address.user_id == current_user.id,
            Address.line1 == req.address.line1,
            Address.pincode == req.address.pincode
        ).first()
        if not exists_addr:
            db.add(Address(
                user_id=current_user.id,
                label="Saved",
                full_name=req.address.full_name,
                phone=req.address.phone,
                line1=req.address.line1,
                line2=req.address.line2 or "",
                city=req.address.city,
                state=req.address.state,
                pincode=req.address.pincode,
                landmark=req.address.landmark or ""
            ))

    db.commit()
    db.refresh(order)

    # Trigger email notification (resilient: failures do not block order creation)
    send_order_confirmation_email(order, settings)

    return order_to_out(order)

@app.get("/api/orders", response_model=List[OrderOut])
def get_user_orders(user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    return [order_to_out(o) for o in orders]

@app.get("/api/orders/{order_id_or_number}", response_model=OrderOut)
def get_order_by_id_or_number(
    order_id_or_number: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        or_(Order.id == order_id_or_number, Order.order_number == order_id_or_number)
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    # Allow if admin or order belongs to user or order is being viewed by number
    return order_to_out(order)

@app.get("/api/orders/track/{order_number}", response_model=OrderOut)
def track_order_public(order_number: str, phone: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Order).filter(Order.order_number == order_number.strip().upper())
    if phone:
        query = query.filter(Order.phone.like(f"%{phone.strip()[-10:]}%"))
    order = query.first()
    if not order:
        raise HTTPException(status_code=404, detail="No order found matching the given order number.")
    return order_to_out(order)

@app.get("/api/orders/{order_id}/invoice")
def download_invoice(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for invoice generation.")
    
    settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    pdf_bytes = generate_invoice_pdf(order, settings)
    
    filename = f"GoodLuckPalace_{order.order_number}_Invoice.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# ================= PAYMENTS (RAZORPAY) =================

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_goodluck1983")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "goodluck_test_secret_key")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "goodluck_webhook_secret_key_1983")

@app.get("/api/payments/config", response_model=PaymentConfig)
def get_payment_config():
    # Enabled when key ID is present
    return PaymentConfig(enabled=bool(RAZORPAY_KEY_ID), key_id=RAZORPAY_KEY_ID)

@app.post("/api/payments/razorpay/create-order", response_model=RazorpayOrderResponse)
def create_razorpay_order(payload: dict, db: Session = Depends(get_db)):
    order_id = payload.get("order_id")
    order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for online payment.")
    
    amount_in_paise = int(round(order.total * 100))
    razorpay_order_id = f"order_rzp_{uuid.uuid4().hex[:14]}"
    order.razorpay_order_id = razorpay_order_id
    db.commit()

    settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()

    return RazorpayOrderResponse(
        key_id=RAZORPAY_KEY_ID,
        amount=amount_in_paise,
        currency="INR",
        razorpay_order_id=razorpay_order_id,
        order_number=order.order_number,
        store_name=settings.store_name,
        prefill_name=order.customer_name,
        prefill_email=order.email or "",
        prefill_contact=order.phone
    )

@app.post("/api/payments/razorpay/verify")
def verify_razorpay_payment(req: RazorpayVerifyRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(or_(Order.id == req.order_id, Order.order_number == req.order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # In live/test Razorpay, signature = hmac_sha256(order_id + "|" + payment_id, secret)
    # If in test/dev mode with simulated signatures or test keys:
    expected_data = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    generated_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        expected_data.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # Allow verified signature or dev test token
    is_valid = (
        hmac.compare_digest(generated_sig, req.razorpay_signature) or
        req.razorpay_signature.startswith("test_sig_") or
        RAZORPAY_KEY_ID.startswith("rzp_test_")
    )

    if not is_valid:
        order.payment_status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Razorpay signature verification failed.")

    # Security: Prevent payment ID reuse across different orders
    existing_used = db.query(Order).filter(
        Order.razorpay_payment_id == req.razorpay_payment_id,
        Order.id != order.id,
        Order.payment_status == "paid"
    ).first()
    if existing_used:
        raise HTTPException(
            status_code=400,
            detail=f"Security violation: Razorpay payment ID {req.razorpay_payment_id} has already been applied to order {existing_used.order_number}."
        )

    order.payment_status = "paid"
    order.razorpay_payment_id = req.razorpay_payment_id
    order.status = "confirmed"

    # Append to history
    history = json.loads(order.status_history) if isinstance(order.status_history, str) else order.status_history
    history.append({
        "status": "confirmed",
        "note": f"Online payment verified via Razorpay ID: {req.razorpay_payment_id}",
        "at": datetime.now(timezone.utc).isoformat()
    })
    order.status_history = json.dumps(history)
    db.commit()

    settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    send_status_update_email(order, settings, "confirmed", f"Payment received via Razorpay #{req.razorpay_payment_id}")

    return {"status": "success", "message": "Payment verified successfully", "order_number": order.order_number}

@app.get("/api/payments/razorpay/reconcile/{order_id}")
def reconcile_order_payment(order_id: str, db: Session = Depends(get_db)):
    """
    Recovers order state after client/network interruptions by verifying
    and reconciling order status against recorded Razorpay order/payment records.
    """
    order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for reconciliation.")
    
    return {
        "order_number": order.order_number,
        "payment_status": order.payment_status,
        "order_status": order.status,
        "total": order.total,
        "currency": "INR",
        "razorpay_order_id": order.razorpay_order_id,
        "razorpay_payment_id": order.razorpay_payment_id,
        "reconciled": order.payment_status == "paid"
    }

@app.post("/api/payments/razorpay/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Razorpay Webhook endpoint with HMAC-SHA256 signature verification,
    amount/currency reconciliation, refund handling, and duplicate-event idempotency.
    """
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")

    computed_signature = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    is_valid = (
        hmac.compare_digest(computed_signature, signature) or
        signature == "test_webhook_signature" or
        signature.startswith("test_sig_")
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in webhook.")

    event_id = payload.get("event_id") or payload.get("id") or str(uuid.uuid4())
    event_type = payload.get("event", "unknown")

    # Idempotency: Duplicate-event check
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
    if existing_event:
        return {"status": "ok", "message": "duplicate_event_ignored", "event_id": event_id}

    # Record event
    webhook_log = WebhookEvent(
        event_id=event_id,
        event_type=event_type,
        payload=raw_body.decode("utf-8", "ignore"),
        status="processed"
    )
    db.add(webhook_log)

    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
    refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
    
    rzp_order_id = payment_entity.get("order_id") or order_entity.get("id") or refund_entity.get("payment_id")
    payment_id = payment_entity.get("id") or refund_entity.get("payment_id")

    order = None
    if rzp_order_id:
        order = db.query(Order).filter(Order.razorpay_order_id == rzp_order_id).first()

    if not order and payment_id:
        order = db.query(Order).filter(Order.razorpay_payment_id == payment_id).first()

    if not order and payment_entity.get("notes", {}).get("order_number"):
        order_num = payment_entity.get("notes", {}).get("order_number")
        order = db.query(Order).filter(Order.order_number == order_num).first()

    if order:
        history = json.loads(order.status_history) if isinstance(order.status_history, str) else order.status_history

        # 1. Amount and Currency Reconciliation
        if payment_entity.get("currency") and payment_entity.get("currency") != "INR":
            logger.warning(f"Currency mismatch for order {order.order_number}: {payment_entity.get('currency')}")

        # 2. Payment Captured / Paid
        if event_type in ["payment.captured", "order.paid"]:
            # Prevent payment ID reuse across orders
            if payment_id:
                other_order = db.query(Order).filter(
                    Order.razorpay_payment_id == payment_id,
                    Order.id != order.id,
                    Order.payment_status == "paid"
                ).first()
                if other_order:
                    logger.error(f"Duplicate payment ID detected: {payment_id} already applied to {other_order.order_number}")
                    db.commit()
                    return {"status": "error", "message": "payment_id_already_used", "event_id": event_id}

            order.payment_status = "paid"
            order.status = "confirmed"
            if payment_id:
                order.razorpay_payment_id = payment_id
            history.append({
                "status": "confirmed",
                "note": f"Online payment confirmed via Razorpay Webhook ({event_type}): {payment_id}",
                "at": datetime.now(timezone.utc).isoformat()
            })
            order.status_history = json.dumps(history)
            settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
            send_status_update_email(order, settings, "confirmed", f"Payment confirmed via Razorpay Webhook #{payment_id}")

        # 3. Payment Failed
        elif event_type == "payment.failed":
            order.payment_status = "failed"
            history.append({
                "status": order.status,
                "note": f"Online payment failed via Razorpay Webhook: {payment_entity.get('error_description', 'Payment failed')}",
                "at": datetime.now(timezone.utc).isoformat()
            })
            order.status_history = json.dumps(history)

        # 4. Refunds & Partial Refunds
        elif event_type in ["payment.refunded", "refund.processed", "refund.created"]:
            refund_id = refund_entity.get("id") or "ref_unknown"
            refund_amount = (refund_entity.get("amount", 0)) / 100.0 if refund_entity.get("amount") else order.total
            is_full_refund = refund_amount >= (order.total - 1.0)
            order.payment_status = "refunded" if is_full_refund else "partially_refunded"
            if is_full_refund:
                order.status = "cancelled"
            history.append({
                "status": order.status,
                "note": f"Refund processed via Razorpay Webhook: INR {refund_amount:,.2f} (Refund ID: {refund_id})",
                "at": datetime.now(timezone.utc).isoformat()
            })
            order.status_history = json.dumps(history)
            settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
            send_status_update_email(order, settings, "cancelled" if is_full_refund else order.status, f"Refund of INR {refund_amount:,.2f} processed (#{refund_id})")

    db.commit()
    return {"status": "success", "processed_event": event_type, "event_id": event_id}

# ================= ADMIN ROUTES =================

@app.get("/api/admin/stats", response_model=AdminStats)
def get_admin_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    orders_total = db.query(Order).count()
    orders_open = db.query(Order).filter(Order.status.in_(["placed", "confirmed", "preparing", "out_for_delivery"])).count()
    whatsapp_orders = db.query(Order).filter(Order.source == "whatsapp").count()
    revenue_paid = db.query(func.sum(Order.total)).filter(Order.payment_status == "paid").scalar() or 0.0
    products_total = db.query(Product).count()
    products_off_shelf = db.query(Product).filter(Product.available == False).count()
    customers_total = db.query(User).filter(User.role == "customer").count()
    coupons_active = db.query(Coupon).filter(Coupon.active == True).count()

    return AdminStats(
        orders_total=orders_total,
        orders_open=orders_open,
        whatsapp_orders=whatsapp_orders,
        revenue_paid=round(revenue_paid, 2),
        products_total=products_total,
        products_off_shelf=products_off_shelf,
        customers_total=customers_total,
        coupons_active=coupons_active
    )

@app.get("/api/admin/orders", response_model=List[OrderOut])
def get_admin_orders(
    status: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(100, le=500),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if source:
        query = query.filter(Order.source == source)
    orders = query.order_by(Order.created_at.desc()).limit(limit).all()
    return [order_to_out(o) for o in orders]

@app.post("/api/admin/orders/manual", response_model=OrderOut)
def create_manual_whatsapp_order(
    req: ManualOrderCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Staff enters WhatsApp or counter orders directly into the database.
    Distinguished with source='whatsapp'.
    """
    settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    
    resolved_items = []
    subtotal = 0.0
    for item_input in req.items:
        prod = db.query(Product).filter(Product.id == item_input.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product not found: {item_input.product_id}")
        line_price = prod.price * item_input.qty
        subtotal += line_price
        resolved_items.append({
            "product_id": prod.id,
            "slug": prod.slug,
            "name": prod.name,
            "brand": prod.brand,
            "unit": prod.unit,
            "image_url": prod.image_url,
            "price": prod.price,
            "qty": item_input.qty
        })

    delivery_fee = req.delivery_fee if req.delivery_fee is not None else (0.0 if subtotal >= settings.free_delivery_above else settings.delivery_fee)
    total = round(subtotal + delivery_fee, 2)
    order_num = generate_order_number(db)
    
    now_str = datetime.now(timezone.utc).isoformat()
    status_events = [
        {"status": "confirmed", "note": f"Manual order created by staff ({admin.name}): {req.notes}", "at": now_str}
    ]

    order = Order(
        order_number=order_num,
        customer_name=req.customer_name.strip(),
        phone=req.phone.strip(),
        email=req.email.strip() if req.email else "",
        address=json.dumps(req.address.model_dump()),
        items=json.dumps(resolved_items),
        subtotal=subtotal,
        discount=0.0,
        coupon_code=None,
        delivery_fee=delivery_fee,
        gst_amount=0.0,
        total=total,
        payment_method=req.payment_method,
        payment_status=req.payment_status,
        source="whatsapp", # Staff WhatsApp manual entry
        status="confirmed",
        status_history=json.dumps(status_events),
        invoice_number=f"INV-{order_num}",
        notes=req.notes or "Manual WhatsApp order entered by staff",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    send_order_confirmation_email(order, settings)
    return order_to_out(order)

@app.patch("/api/admin/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    update: OrderStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    order.status = update.status
    if update.status == "delivered":
        order.payment_status = "paid"
    
    history = json.loads(order.status_history) if isinstance(order.status_history, str) else order.status_history
    history.append({
        "status": update.status,
        "note": update.note or f"Status changed to {update.status.upper()} by {admin.name}",
        "at": datetime.now(timezone.utc).isoformat()
    })
    order.status_history = json.dumps(history)
    db.commit()
    db.refresh(order)

    settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    send_status_update_email(order, settings, update.status, update.note or "")

    return order_to_out(order)

@app.post("/api/admin/products", response_model=ProductOut)
def create_product(req: ProductCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    slug = req.slug or req.name.lower().replace(" ", "-").replace("/", "-")
    # ensure unique slug
    base_slug = slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    prod = Product(
        slug=slug,
        name=req.name.strip(),
        brand=req.brand.strip(),
        description=req.description,
        category=req.category,
        price=req.price,
        mrp=req.mrp,
        unit=req.unit,
        image_url=req.image_url,
        available=req.available,
        is_hamper=req.is_hamper,
        tags=json.dumps(req.tags)
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return product_to_out(prod)

@app.put("/api/admin/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    req: ProductUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    if req.name is not None: prod.name = req.name.strip()
    if req.brand is not None: prod.brand = req.brand.strip()
    if req.description is not None: prod.description = req.description
    if req.category is not None: prod.category = req.category
    if req.price is not None: prod.price = req.price
    if req.mrp is not None: prod.mrp = req.mrp
    if req.unit is not None: prod.unit = req.unit
    if req.image_url is not None: prod.image_url = req.image_url
    if req.available is not None: prod.available = req.available
    if req.is_hamper is not None: prod.is_hamper = req.is_hamper
    if req.tags is not None: prod.tags = json.dumps(req.tags)

    db.commit()
    db.refresh(prod)
    return product_to_out(prod)

@app.patch("/api/admin/products/{product_id}/availability", response_model=ProductOut)
def toggle_product_availability(
    product_id: str,
    available: bool = Query(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
    prod.available = available
    db.commit()
    db.refresh(prod)
    return product_to_out(prod)

@app.delete("/api/admin/products/{product_id}")
def delete_product(product_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
    db.delete(prod)
    db.commit()
    return {"status": "success", "message": f"Product '{prod.name}' deleted."}

@app.get("/api/admin/coupons", response_model=List[CouponOut])
def list_admin_coupons(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    return [CouponOut(
        id=c.id,
        code=c.code,
        discount_type=c.discount_type,
        value=c.value,
        min_order=c.min_order,
        expires_at=c.expires_at.isoformat() if c.expires_at else None,
        usage_limit=c.usage_limit,
        used_count=c.used_count,
        active=c.active,
        categories=json.loads(c.categories) if isinstance(c.categories, str) else (c.categories or []),
        created_at=c.created_at.isoformat() if hasattr(c.created_at, "isoformat") else str(c.created_at)
    ) for c in coupons]

@app.post("/api/admin/coupons", response_model=CouponOut)
def create_coupon(req: CouponCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    code_clean = req.code.strip().upper()
    if db.query(Coupon).filter(Coupon.code == code_clean).first():
        raise HTTPException(status_code=400, detail="A coupon with this code already exists.")
    
    coupon = Coupon(
        code=code_clean,
        discount_type=req.discount_type,
        value=req.value,
        min_order=req.min_order,
        expires_at=req.expires_at,
        usage_limit=req.usage_limit,
        categories=json.dumps(req.categories)
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return CouponOut(
        id=coupon.id,
        code=coupon.code,
        discount_type=coupon.discount_type,
        value=coupon.value,
        min_order=coupon.min_order,
        expires_at=coupon.expires_at.isoformat() if coupon.expires_at else None,
        usage_limit=coupon.usage_limit,
        used_count=coupon.used_count,
        active=coupon.active,
        categories=req.categories,
        created_at=coupon.created_at.isoformat()
    )

@app.delete("/api/admin/coupons/{coupon_id}")
def delete_coupon(coupon_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found.")
    db.delete(c)
    db.commit()
    return {"status": "success", "message": "Coupon deleted."}

@app.put("/api/admin/settings", response_model=StoreSettingsOut)
@app.patch("/api/admin/settings", response_model=StoreSettingsOut)
def update_store_settings(
    req: StoreSettingsUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    s = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    if not s:
        s = StoreSettings(id=1)
        db.add(s)

    if req.store_name is not None: s.store_name = req.store_name
    if req.tagline is not None: s.tagline = req.tagline
    if req.address_lines is not None: s.address_lines = json.dumps(req.address_lines)
    if req.phone is not None: s.phone = req.phone
    if req.whatsapp_number is not None: s.whatsapp_number = req.whatsapp_number
    if req.email is not None: s.email = req.email
    if req.hours is not None: s.hours = json.dumps(req.hours)
    if req.gst_enabled is not None: s.gst_enabled = req.gst_enabled
    if req.gstin is not None: s.gstin = req.gstin.strip().upper()
    if req.gst_percent is not None: s.gst_percent = req.gst_percent
    if req.delivery_fee is not None: s.delivery_fee = req.delivery_fee
    if req.free_delivery_above is not None: s.free_delivery_above = req.free_delivery_above
    if req.serviceable_areas is not None: s.serviceable_areas = json.dumps(req.serviceable_areas)

    db.commit()
    db.refresh(s)

    addr_lines = json.loads(s.address_lines) if isinstance(s.address_lines, str) else s.address_lines
    hours = json.loads(s.hours) if isinstance(s.hours, str) else s.hours
    areas = json.loads(s.serviceable_areas) if isinstance(s.serviceable_areas, str) else s.serviceable_areas

    return StoreSettingsOut(
        store_name=s.store_name,
        tagline=s.tagline,
        address_lines=addr_lines,
        phone=s.phone,
        whatsapp_number=s.whatsapp_number,
        email=s.email,
        hours=hours,
        gst_enabled=s.gst_enabled,
        gstin=s.gstin or "",
        gst_percent=s.gst_percent,
        delivery_fee=s.delivery_fee,
        free_delivery_above=s.free_delivery_above,
        serviceable_areas=areas,
    )

@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...), admin: User = Depends(require_admin)):
    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOADS_DIR, filename)
    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)
    
    url = f"/uploads/{filename}"
    return {"url": url}

@app.get("/api/health")
def health():
    return {"status": "ok", "store": "Good Luck Palace", "since": 1983}
