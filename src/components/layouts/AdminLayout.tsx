import React from "react";
import { Outlet } from "react-router-dom";

/**
 * AdminLayout — Isolated enterprise layout shell for Good Luck Palace ERP.
 * Strictly free of customer header, footer, shopping cart, or promotional modules.
 */
export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="admin-shell min-h-screen bg-[#FAF8F3] text-[#292522] font-sans antialiased selection:bg-[#8F1D22] selection:text-white">
      {children || <Outlet />}
    </div>
  );
}
