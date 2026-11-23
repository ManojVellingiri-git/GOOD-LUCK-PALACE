import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";

/**
 * StorefrontLayout — Exclusively wraps public customer-facing routes.
 * Includes customer header, dynamic padding, customer footer, and customer auth modal.
 * This layout is NEVER rendered on admin routes.
 */
export default function StorefrontLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="site-shell min-h-screen flex flex-col bg-white">
      <Header />
      <main className={`flex-1 ${isHome ? "" : "pt-20"}`}>
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
