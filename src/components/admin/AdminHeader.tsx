import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu, Search, Bell, RefreshCw, ExternalLink, ShieldCheck,
  Clock, AlertTriangle, CheckCircle, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminTab } from "./AdminSidebar";
import type { UserOut } from "@/lib/types";

interface AdminHeaderProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onToggleMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  user: UserOut | null;
  lowStockCount: number;
  openOrdersCount: number;
}

export default function AdminHeader({
  currentTab,
  onSelectTab,
  onToggleMobileMenu,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  user,
  lowStockCount,
  openOrdersCount,
}: AdminHeaderProps) {
  const [time, setTime] = useState<string>("");
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabLabels: Record<AdminTab, string> = {
    overview: "Store Overview & Live Analytics",
    products: "Product Catalog Management",
    categories: "Category & Department Structure",
    brands: "Multi-Brand Portfolio",
    inventory: "Warehouse & Inventory Replenishment",
    orders: "Customer Orders & Delivery Fulfillment",
    whatsapp: "Manual WhatsApp Counter Order Entry",
    customers: "Customer Directory & Order History",
    coupons: "Promotional Coupons & Special Offers",
    hampers: "Luxury Festive & Corporate Hampers",
    analytics: "Sales & Operational Reports",
    settings: "Store Profile, Delivery & GST Configuration",
    staff: "Staff Roles & Access Permissions",
    reviews: "Customer Feedback & Product Ratings",
  };

  const totalAlerts = (lowStockCount > 0 ? 1 : 0) + (openOrdersCount > 0 ? 1 : 0);

  return (
    <header className="h-16 bg-white border-b border-[#E8E0D4] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg border border-[#E8E0D4] text-[#292522] md:hidden hover:bg-[#FAF8F3] cursor-pointer"
        >
          <Menu size={18} />
        </button>

        <div>
          <nav className="flex items-center gap-1.5 text-xs text-[#77716A]">
            <span>Admin</span>
            <span>/</span>
            <span className="font-semibold text-[#8F1D22] capitalize">
              {currentTab}
            </span>
          </nav>
          <h2 className="text-sm sm:text-base font-serif font-bold text-[#292522] hidden sm:block leading-tight">
            {tabLabels[currentTab] || "Management Portal"}
          </h2>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77716A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search across ${currentTab} (name, SKU, brand, phone)...`}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F3] border border-[#E8E0D4] rounded-lg text-xs text-[#292522] placeholder:text-[#77716A]/70 focus:outline-none focus:ring-1 focus:ring-[#C49A50] focus:border-[#C49A50] transition-all"
          />
        </div>
      </div>

      {/* Right: Operational Status, Alerts, Refresh, Store Link */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Coimbatore Time */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#77716A] bg-[#FAF8F3] px-2.5 py-1 rounded-md border border-[#E8E0D4]">
          <Clock size={13} className="text-[#C49A50]" />
          <span className="font-mono">{time}</span>
          <span className="text-[10px] text-[#258451] font-semibold">● Live</span>
        </div>

        {/* Data Refresh Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 px-2.5 text-xs border-[#E8E0D4] hover:bg-[#FAF8F3] cursor-pointer"
          title="Refresh all real-time store data"
        >
          <RefreshCw size={13} className={`mr-1.5 text-[#77716A] ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Notifications & System Alerts */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg border border-[#E8E0D4] hover:bg-[#FAF8F3] text-[#292522] relative cursor-pointer"
            title="System Operational Notifications"
          >
            <Bell size={16} />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#8F1D22] text-white text-[9px] font-bold flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#E8E0D4] rounded-xl shadow-lg p-3 z-50 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D4]">
                <h4 className="font-semibold text-xs text-[#292522] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#258451]" /> Operational Alerts
                </h4>
                <span className="text-[10px] text-[#77716A] font-mono">Good Luck Palace</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                {openOrdersCount > 0 ? (
                  <div
                    onClick={() => {
                      onSelectTab("orders");
                      setNotifOpen(false);
                    }}
                    className="p-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer hover:bg-[#FEF3C7] transition-colors flex items-start gap-2"
                  >
                    <AlertTriangle size={15} className="text-[#D18A24] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#92400E]">
                        {openOrdersCount} Orders Pending Dispatch
                      </p>
                      <p className="text-[11px] text-[#B45309]">
                        Fulfill counter &amp; web delivery orders.
                      </p>
                    </div>
                  </div>
                ) : null}

                {lowStockCount > 0 ? (
                  <div
                    onClick={() => {
                      onSelectTab("inventory");
                      setNotifOpen(false);
                    }}
                    className="p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] cursor-pointer hover:bg-[#FEE2E2] transition-colors flex items-start gap-2"
                  >
                    <Package size={15} className="text-[#8F1D22] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#991B1B]">
                        {lowStockCount} Products Off-Shelf
                      </p>
                      <p className="text-[11px] text-[#B91C1C]">
                        Replenish warehouse &amp; counter stock.
                      </p>
                    </div>
                  </div>
                ) : null}

                {totalAlerts === 0 && (
                  <div className="p-4 text-center text-[#77716A] text-xs flex flex-col items-center gap-1">
                    <CheckCircle size={20} className="text-[#258451]" />
                    <span>All store systems normal. Zero operational backlogs.</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-[#E8E0D4] text-center">
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] text-[#8F1D22] hover:underline font-semibold"
                >
                  Close Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Storefront Link */}
        <Link
          to="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#8F1D22] hover:bg-[#641419] text-white text-xs font-semibold shadow-xs transition-colors"
          title="Open Good Luck Palace online storefront"
        >
          <span>Store</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </header>
  );
}
