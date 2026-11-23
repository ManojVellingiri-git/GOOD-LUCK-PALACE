import os
import json
import logging
import resend

logger = logging.getLogger("email_service")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Good Luck Palace <onboarding@resend.dev>")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

def send_order_confirmation_email(order, settings):
    """
    Sends an order confirmation email to the customer.
    Fails safely without raising exceptions to protect the order placement flow.
    """
    if not RESEND_API_KEY or not order.email or "@" not in order.email:
        logger.info(f"Skipping email delivery for order {order.order_number} (RESEND_API_KEY not set or invalid customer email)")
        return False

    try:
        items_list = json.loads(order.items) if isinstance(order.items, str) else order.items
        items_html = "".join([
            f"<tr><td style='padding:8px; border-bottom:1px solid #E7E2DA;'>{item.get('name')} ({item.get('unit', '')})</td>"
            f"<td style='padding:8px; border-bottom:1px solid #E7E2DA; text-align:center;'>{item.get('qty')}</td>"
            f"<td style='padding:8px; border-bottom:1px solid #E7E2DA; text-align:right;'>INR {float(item.get('price', 0)) * int(item.get('qty', 1)):,.2f}</td></tr>"
            for item in items_list
        ])

        subject = f"Order Confirmation — {order.order_number} | Good Luck Palace"
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px; background-color:#FAF7F2; color:#1C1917;">
            <div style="text-align:center; padding-bottom:15px; border-bottom:2px solid #991B1B;">
                <h1 style="color:#991B1B; margin:0; font-size:24px;">Good Luck Palace</h1>
                <p style="margin:4px 0 0; font-size:12px; color:#B45309;">Departmental Store · Cross Cut Road, Gandhipuram, Coimbatore · Est. 1983</p>
            </div>
            
            <div style="padding:20px 0;">
                <h2 style="font-size:18px; margin-top:0;">Thank you for your order, {order.customer_name}!</h2>
                <p style="font-size:14px; line-height:1.5;">We have received your order <b>{order.order_number}</b>. Our store staff is preparing your items with care.</p>
                
                <div style="background-color:#FFFFFF; border:1px solid #E7E2DA; border-radius:8px; padding:15px; margin:20px 0;">
                    <table style="width:100%; font-size:14px; border-collapse:collapse;">
                        <thead>
                            <tr style="background-color:#FFFBEB; color:#78350F;">
                                <th style="text-align:left; padding:8px;">Item</th>
                                <th style="text-align:center; padding:8px;">Qty</th>
                                <th style="text-align:right; padding:8px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding:8px; font-weight:bold; text-align:right;">Subtotal:</td>
                                <td style="padding:8px; text-align:right; font-family:monospace;">INR {order.subtotal:,.2f}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding:8px; font-weight:bold; text-align:right;">Delivery Fee:</td>
                                <td style="padding:8px; text-align:right; font-family:monospace;">{'FREE' if order.delivery_fee == 0 else f'INR {order.delivery_fee:,.2f}'}</td>
                            </tr>
                            <tr style="font-size:16px; color:#991B1B;">
                                <td colspan="2" style="padding:10px 8px; font-weight:bold; text-align:right; border-top:1px solid #991B1B;">Total Amount:</td>
                                <td style="padding:10px 8px; text-align:right; font-weight:bold; font-family:monospace; border-top:1px solid #991B1B;">INR {order.total:,.2f}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <p style="font-size:13px; color:#57534E;">
                    <b>Payment Method:</b> {order.payment_method.upper()} ({order.payment_status.upper()})<br/>
                    <b>Delivery to:</b> Coimbatore & Gandhipuram Area
                </p>
                
                <p style="font-size:13px; color:#78716C; margin-top:25px; border-top:1px solid #E7E2DA; padding-top:15px; text-align:center;">
                    Need assistance? Call us at <b>{settings.phone}</b> or WhatsApp us at <b>+{settings.whatsapp_number}</b>.<br/>
                    Shop No. 45, Sri Lakshmi Complex, Cross Cut Road, Gandhipuram, Coimbatore - 641012.
                </p>
            </div>
        </div>
        """

        params = {
            "from": FROM_EMAIL,
            "to": [order.email],
            "subject": subject,
            "html": html_content
        }
        resend.Emails.send(params)
        logger.info(f"Confirmation email sent to {order.email} for order {order.order_number}")
        return True
    except Exception as e:
        logger.warning(f"Resend email delivery failed for order {order.order_number}: {e}")
        return False

def send_status_update_email(order, settings, new_status, note=""):
    """
    Sends an order status update email to the customer.
    """
    if not RESEND_API_KEY or not order.email or "@" not in order.email:
        return False

    status_labels = {
        "confirmed": "Order Confirmed & Verified",
        "preparing": "Being Packed with Care at Good Luck Palace",
        "out_for_delivery": "Out for Delivery in Coimbatore",
        "delivered": "Delivered Successfully",
        "cancelled": "Order Cancelled"
    }

    try:
        subject = f"Order Update: {status_labels.get(new_status, new_status.title())} — {order.order_number}"
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:600px; margin:0 auto; padding:20px; background-color:#FAF7F2; color:#1C1917;">
            <div style="text-align:center; padding-bottom:15px; border-bottom:2px solid #991B1B;">
                <h1 style="color:#991B1B; margin:0; font-size:24px;">Good Luck Palace</h1>
                <p style="margin:4px 0 0; font-size:12px; color:#B45309;">Cross Cut Road, Gandhipuram, Coimbatore · Est. 1983</p>
            </div>
            <div style="padding:20px 0;">
                <h2 style="font-size:18px;">Your order status has been updated:</h2>
                <div style="background-color:#FFFFFF; border-left:4px solid #991B1B; padding:15px; border-radius:4px; margin:15px 0;">
                    <p style="font-size:16px; font-weight:bold; margin:0; color:#991B1B;">{status_labels.get(new_status, new_status.upper())}</p>
                    {f"<p style='font-size:13px; color:#57534E; margin:6px 0 0;'>Note: {note}</p>" if note else ""}
                </div>
                <p style="font-size:13px; color:#57534E;">Order Number: <b>{order.order_number}</b></p>
                <p style="font-size:13px; color:#78716C;">For any updates or doorstep delivery timing, message our counter on WhatsApp: <b>+{settings.whatsapp_number}</b>.</p>
            </div>
        </div>
        """
        params = {
            "from": FROM_EMAIL,
            "to": [order.email],
            "subject": subject,
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.warning(f"Status email delivery failed for order {order.order_number}: {e}")
        return False
