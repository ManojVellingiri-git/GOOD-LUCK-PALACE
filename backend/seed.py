import json
import os
import secrets
from .database import engine, SessionLocal, Base
from .models import User, Category, Product, Coupon, StoreSettings
from .auth import hash_password, ADMIN_EMAIL

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Store Settings
        settings = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
        if not settings:
            settings = StoreSettings(
                id=1,
                store_name="Good Luck Palace",
                tagline="Coimbatore's Cherished Departmental Store Since 1983",
                address_lines=json.dumps([
                    "Shop No. 45, Sri Lakshmi Complex, Cross Cut Road",
                    "Opp. Ramraj Textiles, Gandhipuram, Coimbatore",
                    "Tamil Nadu 641012, India"
                ]),
                phone="+91 422 223 6592",
                whatsapp_number="919442236592",
                email="orders@goodluckpalace.com",
                hours=json.dumps([
                    "Mon – Sat: 10:00 AM – 9:00 PM",
                    "Sunday: 4:00 PM – 9:00 PM"
                ]),
                gst_enabled=False,
                gstin="",
                gst_percent=0.0,
                delivery_fee=40.0,
                free_delivery_above=999.0,
                serviceable_areas=json.dumps([
                    "Gandhipuram", "RS Puram", "Saibaba Colony", "Peelamedu", 
                    "R.S. Puram", "Townhall", "Ukkadam", "Ganapathy", "Singanallur"
                ])
            )
            db.add(settings)
            print("Seeded default store settings.")

        # 2. Admin User
        admin_pass = os.getenv("ADMIN_PASSWORD")
        if not admin_pass:
            import secrets
            secret_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".admin_initial_secret")
            if os.path.exists(secret_file):
                with open(secret_file, "r") as f:
                    admin_pass = f.read().strip()
            if not admin_pass:
                # Generate a cryptographically secure random password
                admin_pass = secrets.token_urlsafe(16) + "!GLP"
                with open(secret_file, "w") as f:
                    f.write(admin_pass)
                print(f"[SECURITY] Generated initial admin password saved to: .admin_initial_secret")

        admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=ADMIN_EMAIL,
                name="Store Owner",
                hashed_password=hash_password(admin_pass),
                role="admin"
            )
            db.add(admin_user)
            print(f"Created admin user: {ADMIN_EMAIL}")
        else:
            admin_user.hashed_password = hash_password(admin_pass)
            print(f"Synchronized admin password from secure configuration for: {ADMIN_EMAIL}")

        # Also configure customer account
        cust_pass = os.getenv("CUSTOMER_PASSWORD")
        if not cust_pass:
            cust_pass = "Cust_" + secrets.token_hex(6) + "!983"
            cust_secret_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".customer_initial_secret")
            if not os.path.exists(cust_secret_file):
                with open(cust_secret_file, "w") as f:
                    f.write(cust_pass)
            else:
                with open(cust_secret_file, "r") as f:
                    cust_pass = f.read().strip()

        demo_customer = db.query(User).filter(User.email == "customer@example.com").first()
        if not demo_customer:
            demo_customer = User(
                email="customer@example.com",
                name="Ramesh Kumar",
                hashed_password=hash_password(cust_pass),
                role="customer"
            )
            db.add(demo_customer)
            print("Created customer user: customer@example.com")
        else:
            demo_customer.hashed_password = hash_password(cust_pass)
            print("Synchronized customer credentials from secure configuration.")

        # 3. Categories
        categories_data = [
            {
                "slug": "groceries",
                "name": "Groceries & Provisions",
                "description": "Household essentials, staples, provisions and packaged foods — trusted brands at honest prices since 1983.",
                "image_url": "https://images.pexels.com/photos/39815341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "seo_title": "Groceries & Household Essentials in Gandhipuram | Good Luck Palace Coimbatore",
                "seo_description": "Buy rice, dal, atta, oil, spices and packaged groceries from Good Luck Palace, Cross Cut Road, Gandhipuram, Coimbatore."
            },
            {
                "slug": "cosmetics",
                "name": "Cosmetics & Beauty",
                "description": "Skincare, makeup and beauty essentials from Lakme, Maybelline, Plum, Minimalist and more.",
                "image_url": "https://images.unsplash.com/1593418632104-71bd668d1af1?crop=entropy&cs=srgb&fm=jpg&q=85",
                "seo_title": "Cosmetics & Beauty Shop in Gandhipuram, Coimbatore | Good Luck Palace",
                "seo_description": "Skincare, makeup and beauty products in Coimbatore — Good Luck Palace, Cross Cut Road's trusted cosmetics shop since 1983."
            },
            {
                "slug": "dry-fruits",
                "name": "Dry Fruits & Nuts",
                "description": "Premium almonds, cashews, pistachios, raisins, figs and walnuts — handpicked and freshly packed.",
                "image_url": "https://images.unsplash.com/1524593313283-1e092f06b2f0?crop=entropy&cs=srgb&fm=jpg&q=85",
                "seo_title": "Dry Fruits Shop Cross Cut Road, Coimbatore | Good Luck Palace Gandhipuram",
                "seo_description": "Almonds, cashews, pistachios, anjeer and raisins from Good Luck Palace, Gandhipuram."
            },
            {
                "slug": "perfumes",
                "name": "Perfumes & Fragrances",
                "description": "Perfumes and fragrances for every occasion — from everyday deodorants to signature eau de parfums.",
                "image_url": "https://images.unsplash.com/1657287467374-815cb1477538?crop=entropy&cs=srgb&fm=jpg&q=85",
                "seo_title": "Perfume Shop Coimbatore | Good Luck Palace, Gandhipuram",
                "seo_description": "Perfumes and fragrances in Coimbatore — Skinn, Fogg, Yardley and more at Good Luck Palace."
            },
            {
                "slug": "accessories",
                "name": "Bags & Accessories",
                "description": "Everyday bags, travel accessories, umbrellas and personal accessories curated by our counter team.",
                "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=srgb&fm=jpg&q=85",
                "seo_title": "Bags & Accessories | Good Luck Palace Coimbatore",
                "seo_description": "Handbags, backpacks and daily accessories from Good Luck Palace, Gandhipuram."
            },
            {
                "slug": "hampers",
                "name": "Festive & Gift Hampers",
                "description": "Curated festive hampers — Diwali boxes, wedding return gifts, corporate gifting and dry fruit baskets, hand-assembled in-store.",
                "image_url": "https://images.unsplash.com/1681542787048-be0c067fb962?crop=entropy&cs=srgb&fm=jpg&q=85",
                "seo_title": "Festive & Gift Hampers Coimbatore | Good Luck Palace",
                "seo_description": "Diwali hampers, wedding return gifts, corporate gift boxes and gift sets from Good Luck Palace, Coimbatore."
            }
        ]

        for cat_info in categories_data:
            existing = db.query(Category).filter(Category.slug == cat_info["slug"]).first()
            if not existing:
                db.add(Category(**cat_info))
        print("Seeded product categories.")

        # 4. Products (18 curated sample products spanning all business categories)
        products_data = [
            # Groceries
            {
                "slug": "india-gate-classic-basmati-rice",
                "name": "India Gate Classic Basmati Rice",
                "brand": "India Gate",
                "description": "Aged long-grain royal basmati rice with exceptional aroma and fluffy texture for biryanis and special meals.",
                "category": "groceries",
                "price": 145.0,
                "mrp": 160.0,
                "unit": "1 kg",
                "image_url": "https://images.pexels.com/photos/39815341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["rice", "basmati", "staple"])
            },
            {
                "slug": "aashirvaad-select-sharbati-atta",
                "name": "Aashirvaad Select Sharbati Atta",
                "brand": "Aashirvaad",
                "description": "100% whole wheat MP Sharbati atta, slow ground to retain natural sweetness and fiber for ultra-soft rotis.",
                "category": "groceries",
                "price": 285.0,
                "mrp": 320.0,
                "unit": "5 kg",
                "image_url": "https://images.pexels.com/photos/39815341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["atta", "flour", "staple"])
            },
            {
                "slug": "fortune-sunlite-sunflower-oil",
                "name": "Fortune Sunlite Refined Sunflower Oil",
                "brand": "Fortune",
                "description": "Light and clear refined sunflower cooking oil, enriched with natural Vitamin E for healthy everyday South Indian cooking.",
                "category": "groceries",
                "price": 145.0,
                "mrp": 155.0,
                "unit": "1 L",
                "image_url": "https://images.pexels.com/photos/39815341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["oil", "cooking", "staple"])
            },
            {
                "slug": "tata-sampann-unpolished-toor-dal",
                "name": "Tata Sampann Unpolished Toor Dal",
                "brand": "Tata Sampann",
                "description": "High-protein unpolished toor dal that cooks easily, delivers rich authentic sambar taste and preserves wholesome nutrition.",
                "category": "groceries",
                "price": 155.0,
                "mrp": 170.0,
                "unit": "1 kg",
                "image_url": "https://images.pexels.com/photos/12419503.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["dal", "pulses", "sambar"])
            },
            {
                "slug": "bru-gold-freeze-dried-coffee",
                "name": "Bru Gold Freeze-Dried Pure Coffee",
                "brand": "Bru",
                "description": "Made from handpicked robusta and arabica beans, roasted to perfection for an intense aroma and smooth South Indian coffee taste.",
                "category": "groceries",
                "price": 235.0,
                "mrp": 255.0,
                "unit": "200 g",
                "image_url": "https://images.pexels.com/photos/39815341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["coffee", "beverage"])
            },

            # Dry Fruits
            {
                "slug": "happilo-california-almonds-badam",
                "name": "Premium California Almonds (Badam)",
                "brand": "Happilo",
                "description": "Crisp, whole Grade-A California almonds, high in protein, vitamin E and dietary fiber.",
                "category": "dry-fruits",
                "price": 385.0,
                "mrp": 450.0,
                "unit": "500 g",
                "image_url": "https://images.unsplash.com/1722886705787-4b8d676309fa?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["almonds", "badam", "healthy"])
            },
            {
                "slug": "glp-select-whole-cashews-w240",
                "name": "GLP Select Whole Cashew Nuts W240",
                "brand": "GLP Select",
                "description": "King-size, buttery whole W240 cashews handpicked and cleanly sorted at our Gandhipuram counter.",
                "category": "dry-fruits",
                "price": 475.0,
                "mrp": 540.0,
                "unit": "500 g",
                "image_url": "https://images.unsplash.com/1593006641231-fc7b94496e06?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["cashews", "kaju", "premium"])
            },
            {
                "slug": "iranian-pistachios-roasted-salted",
                "name": "Iranian Pistachios (Roasted & Lightly Salted)",
                "brand": "GLP Select",
                "description": "Naturally opened jumbo Iranian pistachios, slow roasted with a touch of salt for maximum crunch.",
                "category": "dry-fruits",
                "price": 685.0,
                "mrp": 780.0,
                "unit": "250 g",
                "image_url": "https://images.unsplash.com/1661836990173-97481f67f85b?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["pista", "pistachios", "nuts"])
            },
            {
                "slug": "afghan-anjeer-dried-figs",
                "name": "Royal Afghan Anjeer (Dried Figs)",
                "brand": "GLP Select",
                "description": "Plump, naturally sweet sun-dried Afghan figs packed with natural iron and calcium.",
                "category": "dry-fruits",
                "price": 445.0,
                "mrp": 525.0,
                "unit": "250 g",
                "image_url": "https://images.pexels.com/photos/37180553.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["anjeer", "figs", "wellness"])
            },

            # Cosmetics & Beauty
            {
                "slug": "lakme-9to5-weightless-mousse-foundation",
                "name": "Lakme 9to5 Weightless Mousse Foundation",
                "brand": "Lakme",
                "description": "Feather-light matte foundation that blends effortlessly and provides natural day-long coverage.",
                "category": "cosmetics",
                "price": 399.0,
                "mrp": 450.0,
                "unit": "25 g",
                "image_url": "https://images.unsplash.com/1636740599648-ae84f705fc2e?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["makeup", "foundation", "lakme"])
            },
            {
                "slug": "maybelline-colossal-kajal-24hr",
                "name": "Maybelline New York Colossal Kajal",
                "brand": "Maybelline",
                "description": "Smudge-proof, waterproof intense black kajal with aloe vera that lasts up to 24 hours.",
                "category": "cosmetics",
                "price": 249.0,
                "mrp": 299.0,
                "unit": "0.35 g",
                "image_url": "https://images.unsplash.com/1576426863848-c21f53c60b19?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["kajal", "eyes", "maybelline"])
            },
            {
                "slug": "plum-green-tea-alcohol-free-toner",
                "name": "Plum Green Tea Alcohol-Free Toner",
                "brand": "Plum",
                "description": "Refreshing, 100% vegan alcohol-free toner with green tea and glycolic acid to tone and unclog pores.",
                "category": "cosmetics",
                "price": 349.0,
                "mrp": 399.0,
                "unit": "150 ml",
                "image_url": "https://images.unsplash.com/1631730359585-38a4935cbec4?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["skincare", "toner", "vegan"])
            },

            # Perfumes
            {
                "slug": "fogg-napoleon-body-spray",
                "name": "Fogg Fragrant Body Spray — Napoleon",
                "brand": "Fogg",
                "description": "Long-lasting everyday masculine body spray with zero gas and up to 1000 guaranteed sprays.",
                "category": "perfumes",
                "price": 199.0,
                "mrp": 225.0,
                "unit": "120 ml",
                "image_url": "https://images.unsplash.com/1643797517714-a273548abc3c?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["deodorant", "perfume", "fogg"])
            },
            {
                "slug": "skinn-by-titan-raw-edp",
                "name": "Skinn by Titan — Raw Eau De Parfum",
                "brand": "Skinn",
                "description": "An invigorating citrus and woody EDP crafted in France by master perfumers, ideal for boardroom or evening wear.",
                "category": "perfumes",
                "price": 1895.0,
                "mrp": 2195.0,
                "unit": "50 ml",
                "image_url": "https://images.unsplash.com/1657287467374-815cb1477538?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["perfume", "edp", "titan", "luxury"])
            },

            # Bags & Accessories
            {
                "slug": "glp-classic-canvas-tote-bag",
                "name": "Good Luck Palace Heritage Cotton Tote",
                "brand": "GLP Signature",
                "description": "Heavyweight organic cotton tote with reinforced straps, perfect for daily grocery shopping and general errands.",
                "category": "accessories",
                "price": 299.0,
                "mrp": 399.0,
                "unit": "1 piece",
                "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["bag", "tote", "eco-friendly"])
            },
            {
                "slug": "wildcraft-compact-daypack",
                "name": "Wildcraft Compact Everyday Backpack",
                "brand": "Wildcraft",
                "description": "Lightweight, water-repellent urban daypack with padded shoulder straps and dual quick-access bottle pockets.",
                "category": "accessories",
                "price": 799.0,
                "mrp": 999.0,
                "unit": "18 Litres",
                "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": False,
                "tags": json.dumps(["backpack", "travel", "wildcraft"])
            },

            # Hampers
            {
                "slug": "glp-royal-coimbatore-dry-fruit-hamper",
                "name": "The Royal Coimbatore Dry Fruit Hamper",
                "brand": "Good Luck Palace",
                "description": "Grand heritage brass-finish wooden casket filled with hand-sorted California almonds, W240 cashews, roasted pistachios and golden raisins.",
                "category": "hampers",
                "price": 1850.0,
                "mrp": 2200.0,
                "unit": "1.2 kg Box",
                "image_url": "https://images.unsplash.com/1681542787048-be0c067fb962?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": True,
                "tags": json.dumps(["hamper", "festive", "gift", "wedding"])
            },
            {
                "slug": "festive-celebration-sweets-dry-fruits-hamper",
                "name": "Festive Celebration Gift Hamper",
                "brand": "Good Luck Palace",
                "description": "Curated celebration combo featuring premium dry fruits, artisanal chocolates, organic tea, and fragrant incense in festive packaging.",
                "category": "hampers",
                "price": 1250.0,
                "mrp": 1500.0,
                "unit": "850 g Box",
                "image_url": "https://images.unsplash.com/1681542787048-be0c067fb962?crop=entropy&cs=srgb&fm=jpg&q=85",
                "available": True,
                "is_hamper": True,
                "tags": json.dumps(["hamper", "diwali", "return gift"])
            }
        ]

        for p_data in products_data:
            existing = db.query(Product).filter(Product.slug == p_data["slug"]).first()
            if not existing:
                db.add(Product(**p_data))
        print("Seeded 18 curated catalog products.")

        # 5. Coupons
        coupons_data = [
            {"code": "GOODLUCK10", "discount_type": "percent", "value": 10.0, "min_order": 500.0, "active": True},
            {"code": "FESTIVE200", "discount_type": "flat", "value": 200.0, "min_order": 1500.0, "active": True},
            {"code": "FIRSTORDER", "discount_type": "percent", "value": 12.0, "min_order": 300.0, "active": True},
            {"code": "DIWALI15", "discount_type": "percent", "value": 15.0, "min_order": 2000.0, "active": True},
        ]
        for c_data in coupons_data:
            existing = db.query(Coupon).filter(Coupon.code == c_data["code"]).first()
            if not existing:
                db.add(Coupon(**c_data))
        print("Seeded standard admin coupons.")

        db.commit()
        print("Database seed complete!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
