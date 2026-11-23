import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StorefrontLayout from "@/components/layouts/StorefrontLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ShopPage from "@/pages/ShopPage";
import ProductDetail from "@/pages/ProductDetail";
import Hampers from "@/pages/Hampers";
import CartPage from "@/pages/CartPage";
import Checkout from "@/pages/Checkout";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import TrackOrder from "@/pages/TrackOrder";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/authContext";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* ========================================================= */}
          {/* 1. CUSTOMER STOREFRONT LAYOUT                             */}
          {/* Exclusively renders customer header, pages, footer, modal */}
          {/* ========================================================= */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/products" element={<ShopPage />} />
            <Route path="/catalogue" element={<ShopPage />} />
            <Route path="/groceries" element={<CategoryPage slug="groceries" />} />
            <Route path="/cosmetics" element={<CategoryPage slug="cosmetics" />} />
            <Route path="/dry-fruits" element={<CategoryPage slug="dry-fruits" />} />
            <Route path="/perfumes" element={<CategoryPage slug="perfumes" />} />
            <Route path="/accessories" element={<CategoryPage slug="accessories" />} />
            <Route path="/hampers" element={<Hampers />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/account" element={<Account />} />
            <Route path="/search" element={<CategoryPage />} />
          </Route>

          {/* ========================================================= */}
          {/* 2. ADMIN DASHBOARD LAYOUT                                 */}
          {/* Completely isolated: ZERO customer headers, footers, etc  */}
          {/* ========================================================= */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/:tab" element={<Admin />} />
            <Route path="/admin/*" element={<Admin />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </CartProvider>
    </AuthProvider>
  );
}
