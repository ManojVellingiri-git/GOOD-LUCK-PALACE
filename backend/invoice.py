import io
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_invoice_pdf(order, settings) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    brand_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#991B1B')
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#78350F')
    )
    
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#57534E')
    )

    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1C1917')
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1C1917')
    )

    elements = []

    # Store Address from settings
    addr_lines = json.loads(settings.address_lines) if isinstance(settings.address_lines, str) else settings.address_lines
    store_addr_str = "<br/>".join(addr_lines)

    # Header section: Store on Left, Invoice info on Right
    header_data = [
        [
            Paragraph(f"<b>{settings.store_name}</b><br/>{settings.tagline}<br/>{store_addr_str}<br/>Phone: {settings.phone}" + 
                      (f"<br/><b>GSTIN:</b> {settings.gstin}" if settings.gst_enabled and settings.gstin else ""), meta_style),
            Paragraph(f"<font size=16 color='#991B1B'><b>TAX INVOICE</b></font><br/>"
                      f"<b>Invoice #:</b> {order.invoice_number or ('INV-' + order.order_number)}<br/>"
                      f"<b>Order #:</b> {order.order_number}<br/>"
                      f"<b>Date:</b> {order.created_at.strftime('%d %b %Y, %I:%M %p') if hasattr(order.created_at, 'strftime') else str(order.created_at)[:19]}<br/>"
                      f"<b>Payment:</b> {order.payment_method.upper()} ({order.payment_status.upper()})<br/>"
                      f"<b>Source:</b> {order.source.upper()}", meta_style)
        ]
    ]

    header_table = Table(header_data, colWidths=[105 * mm, 75 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 6 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E7E2DA'), spaceAfter=15))

    # Bill To / Delivery To
    addr_obj = json.loads(order.address) if isinstance(order.address, str) else order.address
    cust_addr_str = (
        f"<b>{addr_obj.get('full_name', order.customer_name)}</b><br/>"
        f"Phone: {addr_obj.get('phone', order.phone)}<br/>"
        f"{addr_obj.get('line1', '')}" + (f", {addr_obj.get('line2')}" if addr_obj.get('line2') else "") + "<br/>"
        f"{addr_obj.get('city', 'Coimbatore')}, {addr_obj.get('state', 'Tamil Nadu')} - {addr_obj.get('pincode', '')}" +
        (f"<br/>Landmark: {addr_obj.get('landmark')}" if addr_obj.get('landmark') else "")
    )

    bill_table = Table([
        [
            Paragraph("<b>BILLED & DELIVERED TO:</b><br/>" + cust_addr_str, meta_style),
            Paragraph(f"<b>ORDER STATUS:</b> {order.status.upper()}<br/>"
                      f"<b>CUSTOMER EMAIL:</b> {order.email or 'N/A'}<br/>"
                      f"<b>EST. DELIVERY:</b> Gandhipuram & Coimbatore Area", meta_style)
        ]
    ], colWidths=[110 * mm, 70 * mm])
    bill_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAF7F2')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E7E2DA')),
    ]))
    elements.append(bill_table)
    elements.append(Spacer(1, 6 * mm))

    # Items table
    items_list = json.loads(order.items) if isinstance(order.items, str) else order.items
    items_data = [
        [
            Paragraph("<b>#</b>", meta_style),
            Paragraph("<b>Item Description</b>", meta_style),
            Paragraph("<b>Unit</b>", meta_style),
            Paragraph("<b>Price (INR)</b>", meta_style),
            Paragraph("<b>Qty</b>", meta_style),
            Paragraph("<b>Total (INR)</b>", meta_style),
        ]
    ]

    for idx, item in enumerate(items_list, 1):
        price = float(item.get('price', 0))
        qty = int(item.get('qty', 1))
        line_total = price * qty
        items_data.append([
            Paragraph(str(idx), meta_style),
            Paragraph(f"<b>{item.get('name', '')}</b><br/><font color='#78716C'>{item.get('brand', '')}</font>", meta_style),
            Paragraph(item.get('unit', '-'), meta_style),
            Paragraph(f"{price:,.2f}", meta_style),
            Paragraph(str(qty), meta_style),
            Paragraph(f"{line_total:,.2f}", meta_style),
        ])

    items_table = Table(items_data, colWidths=[10 * mm, 80 * mm, 25 * mm, 25 * mm, 15 * mm, 25 * mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FAF7F2')),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor('#991B1B')),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#E7E2DA')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4 * mm))

    # Summary table (Subtotal, Discount, Delivery, GST, Total)
    summary_rows = [
        [Paragraph("Subtotal:", meta_style), Paragraph(f"INR {order.subtotal:,.2f}", meta_style)]
    ]
    if order.discount and order.discount > 0:
        summary_rows.append([Paragraph(f"Coupon Discount ({order.coupon_code or 'PROMO'}):", meta_style),
                             Paragraph(f"- INR {order.discount:,.2f}", meta_style)])
    
    summary_rows.append([Paragraph("Delivery Charge:", meta_style),
                         Paragraph("FREE" if order.delivery_fee == 0 else f"INR {order.delivery_fee:,.2f}", meta_style)])

    if order.gst_amount and order.gst_amount > 0 and settings.gst_enabled and settings.gstin:
        half_rate = settings.gst_percent / 2.0
        half_amount = order.gst_amount / 2.0
        addr_state = (addr_obj.get("state") or "Tamil Nadu").strip().lower()
        if addr_state in ["tamil nadu", "tn"]:
            summary_rows.append([Paragraph(f"CGST ({half_rate:.1f}%):", meta_style),
                                 Paragraph(f"INR {half_amount:,.2f}", meta_style)])
            summary_rows.append([Paragraph(f"SGST ({half_rate:.1f}%):", meta_style),
                                 Paragraph(f"INR {half_amount:,.2f}", meta_style)])
        else:
            summary_rows.append([Paragraph(f"IGST ({settings.gst_percent:.1f}%):", meta_style),
                                 Paragraph(f"INR {order.gst_amount:,.2f}", meta_style)])
    elif order.gst_amount and order.gst_amount > 0:
        summary_rows.append([Paragraph(f"Tax ({settings.gst_percent}%):", meta_style),
                             Paragraph(f"INR {order.gst_amount:,.2f}", meta_style)])

    summary_rows.append([
        Paragraph("<b>Total Amount:</b>", h2_style),
        Paragraph(f"<b>INR {order.total:,.2f}</b>", h2_style)
    ])

    summary_table = Table(summary_rows, colWidths=[130 * mm, 50 * mm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#991B1B')),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(summary_table)

    elements.append(Spacer(1, 10 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E7E2DA'), spaceAfter=10))
    
    # Store policy & signature footer
    footer_text = (
        "<b>Thank you for shopping with Good Luck Palace — Serving Coimbatore since 1983!</b><br/>"
        "This is a computer-generated invoice for your online/WhatsApp order. For any queries, exchanges, or assistance, "
        f"please reach us on WhatsApp at +{settings.whatsapp_number} or call {settings.phone}."
    )
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=meta_style, alignment=1, fontSize=8, textColor=colors.HexColor('#78716C'))))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
