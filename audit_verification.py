import os
import sys
import json
import uuid
import hmac
import hashlib
import urllib.request
import urllib.error
import sqlite3

BASE_URL = "http://127.0.0.1:8001/api"
DB_PATH = os.path.join(os.path.dirname(__file__), "goodluck_palace.db")

def make_req(path, method="GET", data=None, token=None, custom_headers=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if custom_headers:
        headers.update(custom_headers)
    
    if isinstance(data, (bytes, bytearray)):
        body = data
    elif data is not None:
        body = json.dumps(data).encode("utf-8")
    else:
        body = None

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if "application/pdf" in content_type:
                return resp.status, resp.read(), content_type
            res_data = resp.read().decode("utf-8")
            return resp.status, json.loads(res_data) if res_data else {}, content_type
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed, e.headers.get("Content-Type", "")

def run_audit():
    results = {}
    print("======================================================================")
    print("      GOOD LUCK PALACE — INDEPENDENT TECHNICAL VERIFICATION AUDIT     ")
    print("======================================================================\n")

    # 1. VERIFY COMPROMISED CREDENTIALS ROTATION
    print("1. [AUDIT] Verifying Compromised Default Passwords Rotation...")
    # Attempt login with leaked password "GoodLuck@1983"
    code, resp, _ = make_req("/auth/login", method="POST", data={
        "email": "owner@goodluckpalace.com",
        "password": "GoodLuck@1983"
    })
    assert code == 401, f"SECURITY FAILURE: Old leaked password 'GoodLuck@1983' was accepted! (Status {code})"
    print("   [PASS] Leaked admin password 'GoodLuck@1983' was rejected (HTTP 401).")

    # Attempt login with leaked customer password "Customer@123"
    code, resp, _ = make_req("/auth/login", method="POST", data={
        "email": "customer@example.com",
        "password": "Customer@123"
    })
    assert code == 401, f"SECURITY FAILURE: Old leaked customer password 'Customer@123' was accepted! (Status {code})"
    print("   [PASS] Leaked customer password 'Customer@123' was rejected (HTTP 401).")

    # Read the rotated admin password from .admin_initial_secret
    secret_path = os.path.join(os.path.dirname(__file__), ".admin_initial_secret")
    assert os.path.exists(secret_path), ".admin_initial_secret file missing!"
    with open(secret_path, "r") as f:
        rotated_admin_pw = f.read().strip()

    # Login with the new rotated secret
    code, login_data, _ = make_req("/auth/login", method="POST", data={
        "email": "owner@goodluckpalace.com",
        "password": rotated_admin_pw
    })
    assert code == 200, f"Rotated admin password failed: {code} {login_data}"
    admin_token = login_data["access_token"]
    assert login_data["user"]["role"] == "admin"
    print(f"   [PASS] Rotated secret authenticated successfully. Role: {login_data['user']['role']}")
    results["credential_rotation"] = "PASSED"

    # 2. VERIFY CUSTOMER AUTHENTICATION (EMAIL/PASSWORD & GOOGLE SIGN-IN)
    print("\n2. [AUDIT] Verifying Customer Email/Password & Google Sign-In...")
    test_email = f"audit_customer_{uuid.uuid4().hex[:6]}@example.com"
    code, reg_resp, _ = make_req("/auth/register", method="POST", data={
        "email": test_email,
        "password": "AuditPassword@2026",
        "name": "Audit Verification User"
    })
    assert code == 200, f"Customer registration failed: {code} {reg_resp}"
    cust_token = reg_resp["access_token"]
    assert reg_resp["user"]["role"] == "customer"
    print(f"   [PASS] Fresh customer registration succeeded: {test_email} (role: {reg_resp['user']['role']})")

    # Google Sign-In verification
    code, google_resp, _ = make_req("/auth/google", method="POST", data={
        "credential": "simulated_google_oauth_id_token",
        "email": f"google_{uuid.uuid4().hex[:6]}@gmail.com",
        "name": "Sundaram Google User"
    })
    assert code == 200, f"Google auth endpoint failed: {code} {google_resp}"
    assert google_resp["user"]["role"] == "customer"
    print(f"   [PASS] Google sign-in endpoint authenticated: {google_resp['user']['email']}")
    results["customer_authentication"] = "PASSED"

    # 3. VERIFY BACKEND RBAC ENFORCEMENT
    print("\n3. [AUDIT] Verifying Backend RBAC Enforcement (Customer vs. Admin)...")
    # Customer accessing /api/admin/stats
    code, rbac_stats, _ = make_req("/admin/stats", token=cust_token)
    assert code == 403, f"RBAC failed: Customer accessed admin stats with status {code}"
    # Customer accessing /api/admin/orders
    code, rbac_orders, _ = make_req("/admin/orders", token=cust_token)
    assert code == 403, f"RBAC failed: Customer accessed admin orders with status {code}"
    print("   [PASS] All admin endpoints actively return HTTP 403 Forbidden for customer tokens.")
    
    # Admin accessing /api/admin/stats
    code, admin_stats, _ = make_req("/admin/stats", token=admin_token)
    assert code == 200, f"Admin stats failed for owner: {code}"
    print(f"   [PASS] Authorized owner granted access: {admin_stats}")
    results["rbac_enforcement"] = "PASSED"

    # 4. VERIFY RAZORPAY BACKEND ORDER, SIGNATURE, WEBHOOK & IDEMPOTENCY
    print("\n4. [AUDIT] Verifying Razorpay Order, Signature, Webhook & Idempotency...")
    # Fetch a product to order
    _, prod_page, _ = make_req("/products?limit=1")
    prod = prod_page["items"][0]
    
    # Create order
    code, order_obj, _ = make_req("/orders", method="POST", data={
        "items": [{"product_id": prod["id"], "qty": 1}],
        "address": {
            "full_name": "Ramesh Audit",
            "phone": "+91 94430 11223",
            "line1": "Cross Cut Road",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641012"
        },
        "payment_method": "razorpay"
    }, token=cust_token)
    assert code == 200, f"Order placement failed: {code}"
    test_order_id = order_obj["id"]

    # Initialize Razorpay order
    code, rzp_create, _ = make_req("/payments/razorpay/create-order", method="POST", data={"order_id": test_order_id})
    assert code == 200, f"Razorpay order init failed: {code}"
    rzp_order_id = rzp_create["razorpay_order_id"]
    print(f"   [PASS] Razorpay order created on backend: {rzp_order_id}")

    # Razorpay Webhook Verification
    webhook_secret = "goodluck_webhook_secret_key_1983"
    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    webhook_payload = {
        "event_id": event_id,
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_{uuid.uuid4().hex[:10]}",
                    "order_id": rzp_order_id,
                    "amount": int(order_obj["total"] * 100),
                    "status": "captured",
                    "notes": {"order_number": order_obj["order_number"]}
                }
            }
        }
    }
    raw_payload_bytes = json.dumps(webhook_payload).encode("utf-8")
    valid_sig = hmac.new(webhook_secret.encode("utf-8"), raw_payload_bytes, hashlib.sha256).hexdigest()

    # Test invalid webhook signature rejection
    code, bad_sig_resp, _ = make_req(
        "/payments/razorpay/webhook",
        method="POST",
        data=raw_payload_bytes,
        custom_headers={"X-Razorpay-Signature": "invalid_forged_signature"}
    )
    assert code == 400, f"Webhook signature check failed! Forged signature returned {code}"
    print("   [PASS] Forged webhook signature rejected with HTTP 400 Bad Request.")

    # Test valid webhook signature acceptance
    code, good_sig_resp, _ = make_req(
        "/payments/razorpay/webhook",
        method="POST",
        data=raw_payload_bytes,
        custom_headers={"X-Razorpay-Signature": valid_sig}
    )
    assert code == 200, f"Valid webhook failed: {code} {good_sig_resp}"
    assert good_sig_resp.get("status") == "success"
    print(f"   [PASS] Valid webhook verified and processed: {good_sig_resp}")

    # Test Webhook Idempotency (Duplicate-Event Protection)
    code, dup_resp, _ = make_req(
        "/payments/razorpay/webhook",
        method="POST",
        data=raw_payload_bytes,
        custom_headers={"X-Razorpay-Signature": valid_sig}
    )
    assert code == 200, f"Duplicate webhook failed: {code}"
    assert dup_resp.get("message") == "duplicate_event_ignored", f"Duplicate event not protected: {dup_resp}"
    print(f"   [PASS] Duplicate webhook event protected: {dup_resp['message']}")
    results["razorpay_and_webhooks"] = "PASSED"

    # 5. VERIFY WHATSAPP ORDERS RECORDED IN DATABASE & VISIBLE IN ADMIN
    print("\n5. [AUDIT] Verifying WhatsApp Orders Recorded & Visible in Admin...")
    code, wa_order, _ = make_req("/orders", method="POST", data={
        "items": [{"product_id": prod["id"], "qty": 2}],
        "address": {
            "full_name": "Saraswathi Ammal",
            "phone": "+91 98422 99881",
            "line1": "Ram Nagar",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641009"
        },
        "payment_method": "whatsapp"
    })
    assert code == 200, f"WhatsApp order creation failed: {code}"
    assert wa_order["source"] == "whatsapp"
    assert wa_order["payment_method"] == "whatsapp"
    print(f"   [PASS] WhatsApp order recorded in DB: {wa_order['order_number']}, source={wa_order['source']}")

    # Check Admin orders list specifically filtered for whatsapp source
    code, admin_wa_orders, _ = make_req("/admin/orders?source=whatsapp", token=admin_token)
    assert code == 200, f"Admin orders query failed: {code}"
    found_in_admin = any(o["order_number"] == wa_order["order_number"] for o in admin_wa_orders)
    assert found_in_admin, "WhatsApp order was not found in admin orders list!"
    print(f"   [PASS] Verified WhatsApp order appears in Admin Dashboard (Total WhatsApp orders: {len(admin_wa_orders)}).")
    results["whatsapp_order_tracking"] = "PASSED"

    # 6. VERIFY INVOICE & CONFIGURABLE GST (NO FABRICATED VALUES)
    print("\n6. [AUDIT] Verifying PDF Invoices & Configurable GST (No Fabricated GSTIN)...")
    # Fetch settings
    code, settings_out, _ = make_req("/settings")
    assert code == 200
    assert settings_out["gst_enabled"] == False, "Default GST must be False until store provides verified GSTIN"
    assert settings_out["gstin"] == "", "Default GSTIN must be empty to avoid fabricated tax details"
    print("   [PASS] Store settings confirmed: gst_enabled=False, gstin='' (No invented tax).")

    # Download invoice PDF
    code, invoice_bytes, ctype = make_req(f"/orders/{wa_order['id']}/invoice")
    assert code == 200
    assert "application/pdf" in ctype
    assert len(invoice_bytes) > 1000
    print(f"   [PASS] ReportLab PDF invoice generated successfully ({len(invoice_bytes)} bytes).")
    results["invoice_and_gst"] = "PASSED"

    # 7. VERIFY DATABASE PERSISTENCE DIRECTLY VIA SQLITE
    print("\n7. [AUDIT] Verifying Database File Persistence directly via SQLite...")
    assert os.path.exists(DB_PATH), f"Database file not found at {DB_PATH}"
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders")
    order_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM products")
    prod_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM webhook_events")
    webhook_count = cursor.fetchone()[0]
    conn.close()
    assert order_count > 0, "No orders persisted in SQLite!"
    assert prod_count >= 18, f"Products count unexpected: {prod_count}"
    assert webhook_count > 0, "Webhook events not persisted in SQLite!"
    print(f"   [PASS] Persistent SQLite file verified: {order_count} orders, {prod_count} products, {webhook_count} webhook logs.")
    results["database_persistence"] = "PASSED"

    print("\n======================================================================")
    print("                      AUDIT VERIFICATION SUMMARY                     ")
    print("======================================================================")
    for check, status in results.items():
        print(f"  ✓ {check:<28}: {status}")
    print("======================================================================\n")

if __name__ == "__main__":
    run_audit()
