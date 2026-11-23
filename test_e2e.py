import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8001/api"

def make_req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
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

def test_all():
    print("--- 1. Testing Store Settings ---")
    status, settings, _ = make_req("/settings")
    assert status == 200, f"Settings failed: {status}"
    print(f"PASS: Store settings loaded for: {settings['store_name']} ({settings['whatsapp_number']})")

    print("\n--- 2. Testing Customer Login ---")
    status, cust_login, _ = make_req("/auth/login", method="POST", data={
        "email": "customer@example.com",
        "password": "Customer@123"
    })
    assert status == 200, f"Customer login failed: {status} {cust_login}"
    cust_token = cust_login["access_token"]
    print(f"PASS: Customer logged in: {cust_login['user']['name']} (role: {cust_login['user']['role']})")

    print("\n--- 3. Testing RBAC: Customer trying to access Admin endpoint ---")
    status, rbac_resp, _ = make_req("/admin/stats", token=cust_token)
    assert status == 403, f"RBAC failed! Customer got access with status {status}"
    print(f"PASS: Correctly rejected customer from admin endpoint with 403: {rbac_resp.get('detail')}")

    print("\n--- 4. Testing Admin Login ---")
    status, admin_login, _ = make_req("/auth/login", method="POST", data={
        "email": "owner@goodluckpalace.com",
        "password": "GoodLuck@1983"
    })
    assert status == 200, f"Admin login failed: {status} {admin_login}"
    admin_token = admin_login["access_token"]
    assert admin_login["user"]["role"] == "admin"
    print(f"PASS: Admin authenticated: {admin_login['user']['email']} (role: {admin_login['user']['role']})")

    print("\n--- 5. Testing Admin Stats Access ---")
    status, stats, _ = make_req("/admin/stats", token=admin_token)
    assert status == 200, f"Admin stats failed: {status}"
    print(f"PASS: Admin stats retrieved: orders_total={stats['orders_total']}, products_total={stats['products_total']}")

    print("\n--- 6. Testing Product Catalog & Stock ---")
    status, prod_page, _ = make_req("/products")
    assert status == 200, f"Products failed: {status}"
    assert len(prod_page["items"]) > 0, "No products found!"
    sample_prod = prod_page["items"][0]
    print(f"PASS: Catalog active with {prod_page['total']} products. Sample: {sample_prod['name']} (₹{sample_prod['price']})")

    print("\n--- 7. Testing Online Order Creation (Razorpay flow) ---")
    order_data = {
        "items": [
            {
                "product_id": sample_prod["id"],
                "qty": 2
            }
        ],
        "address": {
            "full_name": "Ramesh Kumar",
            "phone": "+91 98430 11223",
            "line1": "Flat 302, Green View Apartments",
            "line2": "Ram Nagar",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641009",
            "landmark": "Near Bus Stop"
        },
        "payment_method": "razorpay"
    }
    status, order_resp, _ = make_req("/orders", method="POST", data=order_data, token=cust_token)
    assert status == 200, f"Order creation failed: {status} {order_resp}"
    order_id = order_resp["id"]
    order_number = order_resp["order_number"]
    print(f"PASS: Online order created: {order_number} (ID: {order_id}), Total: ₹{order_resp['total']}")

    print("\n--- 8. Testing Razorpay Order Initialization & Verification ---")
    status, rzp_order, _ = make_req("/payments/razorpay/create-order", method="POST", data={"order_id": order_id})
    assert status == 200, f"Razorpay order failed: {status} {rzp_order}"
    print(f"PASS: Razorpay order generated: {rzp_order['razorpay_order_id']} for amount ₹{rzp_order['amount']/100}")

    status, rzp_verify, _ = make_req("/payments/razorpay/verify", method="POST", data={
        "order_id": order_id,
        "razorpay_order_id": rzp_order["razorpay_order_id"],
        "razorpay_payment_id": "pay_test_verified_123",
        "razorpay_signature": "test_sig_verified"
    })
    assert status == 200, f"Razorpay verification failed: {status} {rzp_verify}"
    assert rzp_verify["status"] == "success"
    print(f"PASS: Payment verified! Order status confirmed.")

    print("\n--- 9. Testing WhatsApp Order Creation ---")
    wa_order_data = {
        "items": [
            {
                "product_id": sample_prod["id"],
                "qty": 1
            }
        ],
        "address": {
            "full_name": "Priya Sundaram",
            "phone": "+91 94433 88990",
            "line1": "12, Cross Cut Road",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641012"
        },
        "payment_method": "whatsapp"
    }
    status, wa_order_resp, _ = make_req("/orders", method="POST", data=wa_order_data)
    assert status == 200, f"WhatsApp order failed: {status} {wa_order_resp}"
    assert wa_order_resp["source"] == "whatsapp"
    assert wa_order_resp["payment_method"] == "whatsapp"
    print(f"PASS: WhatsApp order created: {wa_order_resp['order_number']}, source={wa_order_resp['source']}")

    print("\n--- 10. Testing Admin Manual WhatsApp Order Entry ---")
    manual_order_data = {
        "customer_name": "Dr. Vellingiri (Phone Call)",
        "phone": "+91 98940 55443",
        "items": [
            {
                "product_id": sample_prod["id"],
                "qty": 3
            }
        ],
        "address": {
            "full_name": "Dr. Vellingiri",
            "phone": "+91 98940 55443",
            "line1": "Opposite Ramraj, Gandhipuram (Counter pickup)",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641012"
        },
        "notes": "Customer called on store landline; requested festive packaging",
        "payment_status": "paid",
        "payment_method": "whatsapp"
    }
    status, manual_resp, _ = make_req("/admin/orders/manual", method="POST", data=manual_order_data, token=admin_token)
    assert status == 200, f"Manual order entry failed: {status} {manual_resp}"
    print(f"PASS: Manual order created by admin: {manual_resp['order_number']} (Status: {manual_resp['status']})")

    print("\n--- 11. Testing Admin Order Status Update ---")
    status, status_resp, _ = make_req(f"/admin/orders/{order_id}/status", method="PATCH", data={
        "status": "out_for_delivery",
        "note": "Dispatch rider departed Gandhipuram store"
    }, token=admin_token)
    assert status == 200, f"Status update failed: {status} {status_resp}"
    assert status_resp["status"] == "out_for_delivery"
    print(f"PASS: Order {order_id} status updated to: {status_resp['status']}")

    print("\n--- 12. Testing Downloadable Tax Invoice (PDF) ---")
    status, pdf_bytes, content_type = make_req(f"/orders/{order_id}/invoice")
    assert status == 200, f"Invoice fetch failed: {status}"
    assert "application/pdf" in content_type, f"Expected PDF content type, got: {content_type}"
    assert len(pdf_bytes) > 1000, f"Invoice PDF too small ({len(pdf_bytes)} bytes)"
    print(f"PASS: Tax Invoice generated successfully ({len(pdf_bytes)} bytes, {content_type})")

    print("\n==========================================")
    print("ALL 12 END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    test_all()
