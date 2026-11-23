# Good Luck Palace (Est. 1983) — Production Handover & Operations Guide

**Store Address:** Shop No. 45, Sri Lakshmi Complex, Cross Cut Road, opposite Ramraj Textiles, Gandhipuram, Coimbatore, Tamil Nadu 641012, India  
**Phone:** +91 422 223 6592 | **WhatsApp:** +91 94422 36592  
**Business Hours:** Monday–Saturday 10:00 AM – 9:00 PM; Sunday 4:00 PM – 9:00 PM  

---

## 1. Executive Summary & Architecture

This application is a production-oriented e-commerce system built specifically for **Good Luck Palace**, Gandhipuram, Coimbatore. It honors the heritage of a trusted departmental store established in 1983 while providing modern digital conveniences: dual-channel ordering (WhatsApp and Razorpay online payments), a persistent relational database, server-side PDF tax invoice generation, customer accounts, and an administrative back-office portal.

```
┌────────────────────────────────────────────────────────┐
│             Good Luck Palace Frontend (Vite/React)    │
│  - Customer Storefront (Groceries, Cosmetics, Hampers) │
│  - Dual Checkout (WhatsApp Flow & Razorpay Online)     │
│  - Order Tracking & Customer Account Dashboard         │
│  - Secure Admin Dashboard with Role-Based Access       │
└──────────────────────────┬─────────────────────────────┘
                           │ Proxied (/api -> 8001)
┌──────────────────────────▼─────────────────────────────┐
│             FastAPI Backend (Python 3.12)              │
│  - Persistent SQLite Database (goodluck_palace.db)     │
│  - JWT Authentication & Strict Admin Security Check    │
│  - Razorpay HMAC-SHA256 Signature Verification         │
│  - ReportLab PDF Tax Invoice Generator Engine         │
│  - Resend Email Service Integration (Fail-safe)        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Default Access Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Store Owner (Admin)** | `owner@goodluckpalace.com` | `GoodLuck@1983` | Full back-office: orders, manual entries, stock, products, coupons, settings |
| **Sample Customer** | `customer@example.com` | `Customer@123` | Storefront browsing, cart, checkout, tracking, order history |

> **Security Guarantee:** Admin authorization is strictly locked to the designated store owner email (`ADMIN_EMAIL="owner@goodluckpalace.com"`). Self-registration on the website only creates `customer` accounts. Attempts by customers to access administrative endpoints return HTTP 403 Forbidden.

---

## 3. Dual-Channel Ordering: WhatsApp vs. Razorpay Online

### A. WhatsApp Ordering
- **Customer Experience:** Customers browse items, add them to their cart, and select **"Order via WhatsApp"** at checkout. 
- **System Action:** An order record is saved in the database with `source="whatsapp"` and `payment_method="whatsapp"`. The system then formats a Tamil Nadu polite greeting with items, quantities, and delivery address, opening a pre-filled WhatsApp chat to the store's number (`+91 94422 36592`).
- **Store Workflow:** Counter staff verify item availability on physical shelves, confirm delivery charges with the customer over WhatsApp/call, and update the status in the Admin Portal.
- **Manual WhatsApp Entry:** For customers who call the store directly or text without checking out on the website, counter staff use the **"Manual WhatsApp Order Entry"** tab in the Admin Portal to record the order, assign items, and generate an official invoice number.

### B. Razorpay Online Payments
- **Customer Experience:** Customers select **"Pay Online (UPI / Cards / NetBanking)"**.
- **System Action:** The backend initializes a Razorpay order (`/api/payments/razorpay/create-order`). The customer completes payment via the Razorpay checkout modal. The backend verifies the HMAC-SHA256 cryptographic signature (`/api/payments/razorpay/verify`) before marking the order as `paid` and `confirmed`.
- **Invoicing:** An official downloadable PDF Tax Invoice is immediately generated.

---

## 4. Non-Technical Store Owner & Staff Handover Guide

### A. How to Log In to the Admin Portal
1. Navigate to `http://localhost:3000` (or your production URL).
2. Click **"Sign In"** in the top navigation bar.
3. Enter `owner@goodluckpalace.com` and your password.
4. Once signed in, a prominent **"Admin Portal"** button appears in the header. Click it to enter the dashboard at `/admin`.

### B. Managing Daily Orders
1. Open the **"Orders"** tab.
2. Orders display badges:
   - **Source:** `WhatsApp Order` or `Online Web Order`.
   - **Payment:** `Pending` (unpaid / WhatsApp cash-on-delivery) or `Paid` (Razorpay verified).
   - **Status:** `Confirmed` -> `Preparing` -> `Out for Delivery` -> `Delivered`.
3. To update an order's progress, select the new status from the dropdown (e.g., when the delivery boy departs Gandhipuram, choose **"Out for Delivery"** and add a note). The customer receives an automated status email.
4. Click **"Tax Invoice (PDF)"** on any order card to download and print the formal invoice for physical delivery packing.

### C. Logging Offline / Phone / WhatsApp Orders (Manual Order Entry)
1. In the Admin Portal, click the **"Manual Order Entry"** tab.
2. Enter the customer's name, phone number, and delivery address.
3. Select the ordered products and quantities from the dropdown.
4. Enter any staff notes (e.g., *"Customer requested festive gift packaging"*).
5. Click **"Record WhatsApp Order & Generate Invoice"**. This immediately updates store inventory and stats.

### D. Managing Product Shelves & Stock Availability
1. Open the **"Product Catalog"** tab.
2. Each item features an instant **In Stock / Off Shelf** toggle switch.
3. When an item runs out on physical shelves in Gandhipuram, click the toggle to set it to **"Off Shelf"**. The customer storefront instantly reflects out-of-stock status, preventing customers from placing orders for it.
4. Click **"Edit"** to adjust retail prices or update descriptions, or click **"Add New Product"** to list new arrivals.

### E. Store Settings & GST Configuration
1. Open the **"Store Settings"** tab.
2. Configure:
   - **GST Toggle & GSTIN:** Turn GST calculation on/off and update the store's verified 15-digit GSTIN.
   - **Delivery Fee:** Standard flat fee and the threshold for Free Delivery (default: Free delivery on orders above ₹1,000).
   - **WhatsApp Number & Contact Hours:** Update the mobile number where customer order chats arrive.

---

## 5. Environment Variables & Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./goodluck_palace.db` |
| `ADMIN_EMAIL` | Sole email authorized for admin access | `owner@goodluckpalace.com` |
| `JWT_SECRET` | Secret key for signing session tokens | Strong random 64-character string |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_goodluck1983` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `goodluck_test_secret_key` |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Verified sending domain email | `orders@goodluckpalace.com` |
| `STORE_WHATSAPP_NUMBER` | Store WhatsApp number with country code | `919442236592` |

---

## 6. Database Migration & Seeding Instructions

The SQLite database file `goodluck_palace.db` is automatically created on first boot. To reset or seed the catalog with sample items across all categories:

```powershell
# Activate Python virtual environment
.\backend_venv\Scripts\activate

# Run database seeder
python -m backend.seed
```

This populates:
- 6 Store Categories: Groceries & Provisions, Cosmetics & Beauty, Dry Fruits & Nuts, Perfumes & Attars, Bags & Accessories, Gift Hampers.
- 18 Curated Products with Tamil Nadu regional favourites (Kashmiri Walnuts, Nilgiri Eucalyptus Oil, Mysore Sandal Gold, Ponni Boiled Rice, Royal Hamper).
- Active Coupons: `GOODLUCK10` (10% off), `FESTIVE1983` (Flat ₹150 off).
- Default Store Settings and verified Coimbatore business hours.
- Store Owner Administrator account and demo customer account.

---

## 7. Running the Application Locally

Use the provided one-click launcher script:
```powershell
.\start_all.bat
```

Or run manually in two terminal tabs:
```powershell
# Tab 1: Backend
.\backend_venv\Scripts\activate
uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload

# Tab 2: Frontend
npm run dev
```

Visit:
- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Interactive Backend API Docs:** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 8. Automated Verification & Testing

An end-to-end test suite is included in `test_e2e.py`. To run all 12 verification checks:

```powershell
.\backend_venv\Scripts\python test_e2e.py
```

**Verification Results:**
- [x] Store Settings retrieval
- [x] Customer registration & login
- [x] Role-Based Access Control (RBAC 403 enforcement for non-admin)
- [x] Store Owner authentication
- [x] Admin stats endpoint
- [x] Product catalog & shelf availability
- [x] Online order placement
- [x] Razorpay order creation & HMAC verification
- [x] WhatsApp order creation with proper source tracking
- [x] Admin manual WhatsApp order entry
- [x] Admin order status updates & notification logging
- [x] ReportLab downloadable PDF Tax Invoice generation

---

## 9. Pre-Production Launch Checklist

Before launching to live customers in Coimbatore, obtain and verify the following from the business owner:

- [ ] **WhatsApp Number:** Confirm the physical smartphone SIM card number dedicated to the store's counter staff (`+91 94422 36592`).
- [ ] **Admin Email:** Confirm the primary email address for the store owner. Update `ADMIN_EMAIL` in `.env`.
- [ ] **Domain & Email Service:** Verify the domain (e.g., `goodluckpalace.com`) in Resend DNS settings to ensure order emails do not land in customer spam folders.
- [ ] **Razorpay Live Credentials:** Swap `rzp_test_...` with live `rzp_live_...` Key ID and Secret in `.env`. Complete Razorpay KYC for Good Luck Palace's bank account.
- [ ] **GST Details:** Confirm whether the store charges composite GST or itemized tax, and enter the verified 15-digit GSTIN in the Admin Settings tab.
- [ ] **Delivery Policy & Radii:** Confirm standard delivery rates and free delivery threshold for Gandhipuram, RS Puram, Peelamedu, Saibaba Colony, and suburban Coimbatore.
- [ ] **Product Catalogue & Photography:** Upload actual shelf photographs and prices for initial inventory using the Admin Portal.
