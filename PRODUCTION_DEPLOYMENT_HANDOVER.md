# Good Luck Palace (Est. 1983) — Production Readiness & Deployment Handover Manual

**Store Address:** Shop No. 45, Sri Lakshmi Complex, Cross Cut Road, opposite Ramraj Textiles, Gandhipuram, Coimbatore, Tamil Nadu 641012  
**Phone:** +91 422 223 6592 | **WhatsApp Ordering:** +91 94422 36592  
**Operating Hours:** Mon–Sat 10:00 AM – 9:00 PM; Sun 4:00 PM – 9:00 PM  
**Current Milestone:** Conditional Technical Acceptance Approved · Production Launch Preparation Stage  

---

## 1. Verified Snapshots & Pre-Hardening Archives

Before applying final hardening, point-in-time database snapshots were created and preserved:
- **Pre-Audit Baseline Snapshot:** `backups/pre_verification_backup/goodluck_palace_pre_audit.db`
- **Conditional Approval Snapshot:** `backups/conditional_approval_snapshot/goodluck_palace_verified.db`
- **Live Database File:** `goodluck_palace.db`

---

## 2. Hardened Architecture & Security Subsystems

### A. Google OAuth 2.0 / OIDC Verification
- **JWKS Cryptographic Verification:** Integrated `jwt.PyJWKClient` pointing to Google's official key set (`https://www.googleapis.com/oauth2/v3/certs`).
- **Claim Validations:**
  1. `iss`: Strictly verified against `accounts.google.com` or `https://accounts.google.com`.
  2. `exp`: Strictly rejected if expired (`exp < current_timestamp`).
  3. `aud` & `azp`: Validated against `GOOGLE_CLIENT_ID` when configured.
  4. `email_verified`: Rejects accounts where Google flags the email as unverified.
  5. **Account Linking Defense:** Prevents privilege escalation. A Google sign-in cannot assume the `admin` role unless the verified Google email is strictly equal to `ADMIN_EMAIL`.

### B. Razorpay Payment Reconciliation, Idempotency & Refund Lifecycle
- **HMAC Signature Check:** Server verifies `hmac_sha256(order_id + "|" + payment_id, secret)` on `/api/payments/razorpay/verify`.
- **Payment ID Reuse Prevention:** Enforces that a `razorpay_payment_id` once marked `paid` cannot be applied to another order (returns HTTP 400).
- **Amount & Currency Reconciliation:** Checks that paise amount matches `order.total * 100` and `currency == "INR"`.
- **Concurrent Webhook Idempotency:** The database table `webhook_events` enforces a `UNIQUE(event_id)` index. Under a 5-thread concurrent duplicate burst test, exactly 1 thread processes the event and 4 return `duplicate_event_ignored` without race conditions.
- **Refund & Partial Refund Handling:** Webhook handles `payment.refunded` and `refund.processed`:
  - Full refund updates order to `payment_status="refunded"`, `status="cancelled"`.
  - Partial refund updates order to `payment_status="partially_refunded"`.
  - An automated customer notification email is triggered.
- **Server Crash & Recovery Endpoint:** `GET /api/payments/razorpay/reconcile/{order_id}` allows counter staff or customers to recover and reconcile state if a browser was closed or network interrupted mid-checkout.

### C. Rate Limiting Architecture
- **Current Single-Instance Implementation:** In-memory sliding-window rate limiter in `backend/auth.py` (max 10 attempts per minute per IP/account; returns **HTTP 429 Too Many Requests**).
- **Multi-Instance Cloud Architecture (Redis):** If deployed across multiple load-balanced worker instances (e.g., AWS ECS, Render, or Railway), set `REDIS_URL=redis://user:password@host:6379` in `.env` to switch to shared Redis rate limiting without code changes.

### D. Database Disaster Recovery & Automated Backups
- **Online Zero-Downtime Backup API:** Built with Python `sqlite3.Connection.backup()`, allowing safe backups while customers are placing orders without file lock contention.
- **Integrity Verification:** Executes `PRAGMA integrity_check;` before and after backups to verify zero disk/index corruption.
- **Restoration Drill Verified:** Automated canary test verified 100% point-in-time restoration without data loss.
- **Automated Backup Command:**
  ```powershell
  python backup_manager.py
  ```
- **Recommended Off-Site Backup Cron:**
  A daily cron job can sync the `backups/` directory to an S3/Cloudflare R2 bucket:
  ```bash
  # Daily at 3:00 AM: backup, prune older than 7 days, sync to S3
  0 3 * * * python /var/www/goodluck-palace/backup_manager.py && aws s3 sync /var/www/goodluck-palace/backups/ s3://goodluck-palace-backups/ --delete
  ```

### E. GST & Invoice Math (Inclusive vs. Exclusive)
- **Current Live Store State:** GST is **disabled** (`gst_enabled=False`, `gstin=""`). Zero fabricated or unverified tax details appear on customer invoices.
- **Configurable Tax Math:**
  - **Intrastate (Coimbatore / Tamil Nadu):** 
    - At 5% GST: **CGST 2.5%** + **SGST 2.5%**
    - At 12% GST: **CGST 6.0%** + **SGST 6.0%**
    - At 18% GST: **CGST 9.0%** + **SGST 9.0%**
  - **Interstate (Outside Tamil Nadu):**
    - **IGST** (Full percentage)
  - **Tax-Inclusive Pricing (Retail Shelves):** For grocery/cosmetic items where MRP includes GST:
    $$\text{Tax Base} = \frac{\text{Total}}{1 + \text{Rate}}, \quad \text{Tax Amount} = \text{Total} - \text{Tax Base}$$
  - **Tax-Exclusive Pricing:**
    $$\text{Tax Amount} = \text{Subtotal} \times \text{Rate}, \quad \text{Total} = \text{Subtotal} + \text{Tax Amount}$$

### F. WhatsApp Ordering Workflow Clarification
- **Zero API Commissions:** Does not require the Meta WhatsApp Business Cloud API (which charges per conversation template and requires verified business portfolios).
- **How It Operates:**
  1. Customer builds a cart and clicks **"Order via WhatsApp"**.
  2. The system logs an order with `source="whatsapp"` and `payment_method="whatsapp"`.
  3. Pre-formatted message opens directly in WhatsApp to `+91 94422 36592`.
  4. Counter staff confirm shelf stock, confirm delivery timing, and update order status in the Admin Portal.
  5. Staff can also use the **"Manual WhatsApp Order Entry"** tab to input phone/walk-in orders directly into the persistent database.

---

## 3. Production Deployment Guide

### Architecture Topology
```
                     Internet (Port 443 / HTTPS)
                                │
                        ┌───────▼────────┐
                        │ Caddy / Nginx  │ (TLS Termination & Static Files)
                        └───────┬────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │                                       │
     /api/*, /uploads/*                          /* (SPA)
            │                                       │
  ┌─────────▼────────┐                    ┌─────────▼────────┐
  │ Uvicorn (FastAPI)│                    │ React / Vite     │
  │ 127.0.0.1:8001   │                    │ (dist/ folder)   │
  └─────────┬────────┘                    └──────────────────┘
            │
  ┌─────────▼────────┐
  │ SQLite (WAL Mode)│ (or managed PostgreSQL via DATABASE_URL)
  └──────────────────┘
```

### Step 1: Frontend Production Build
```bash
npm run build
```
Generates optimized static assets in `dist/`.

### Step 2: Systemd Backend Service (`/etc/systemd/system/goodluck-backend.service`)
```ini
[Unit]
Description=Good Luck Palace FastAPI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/goodluck-palace
EnvironmentFile=/var/www/goodluck-palace/.env
ExecStart=/var/www/goodluck-palace/backend_venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

### Step 3: HTTPS Reverse Proxy
Use the provided [Caddyfile](file:///c:/Users/MANOJ%20VELLINGIRI/OneDrive/Desktop/Goodluck%20palace/Caddyfile) for automatic SSL or [nginx.conf](file:///c:/Users/MANOJ%20VELLINGIRI/OneDrive/Desktop/Goodluck%20palace/nginx.conf).

---

## 4. Pre-Launch Credential Collection Checklist

Before switching payment and email gateways to live mode:

- [ ] **Physical WhatsApp Device:** Confirm SIM card `+91 94422 36592` is monitored by shop staff in Gandhipuram.
- [ ] **Admin Owner Email:** Finalize the owner's primary email. Update `ADMIN_EMAIL` in `.env`.
- [ ] **Admin Password Handover:** Deliver the secure initial password from `.admin_initial_secret` to the owner, and assist them in changing it via `/account` or `/api/auth/change-password`.
- [ ] **Razorpay Production Account:** Swap `rzp_test_...` with `rzp_live_...` credentials. Register the production webhook URL: `https://goodluckpalace.com/api/payments/razorpay/webhook`.
- [ ] **Resend Sending Domain:** Complete DNS verification (DKIM, SPF, MX) for `goodluckpalace.com` on Resend and add the live `RESEND_API_KEY`.
- [ ] **Store GSTIN:** Obtain the store's verified 15-digit GSTIN and enable GST in the Admin Settings tab.
- [ ] **Product Catalogue & Photos:** Review the 18 seeded products and replace placeholders with real store photos.

---

## 5. Commercial Recommendation for MVP SYNDICATE

Prior to public launch and official handover, establish a written Service Level & Ownership Agreement between MVP SYNDICATE and Good Luck Palace covering:
1. **Hosting & Server Infrastructure:** Specify whether hosting costs (cloud VPS, domain renewal, SSL, transactional email) are billed monthly/annually or maintained by the client.
2. **Domain & Account Ownership:** Define ownership of the domain name (`goodluckpalace.com`), Razorpay merchant account, and Google Cloud project.
3. **Warranty & Bug-Fix Period:** Establish a clear 30- to 60-day post-launch warranty window for bug fixes, after which maintenance/feature enhancements transition to a retainer or hourly rate.
4. **Source Code & IP Rights:** Clarify whether the client receives a perpetual non-exclusive license or full intellectual property assignment upon final invoice clearance.
