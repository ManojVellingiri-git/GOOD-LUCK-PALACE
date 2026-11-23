import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Package, Layers, Award, Boxes, ShoppingBag,
  PhoneCall, Users, TicketPercent, Gift, BarChart3, Settings,
  ShieldCheck, MessageSquareQuote, LogOut, ChevronLeft, ChevronRight,
  ExternalLink, Store, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserOut } from "@/lib/types";

export type AdminTab =
  | "overview"
  | "products"
  | "categories"
  | "brands"
  | "inventory"
  | "orders"
  | "whatsapp"
  | "customers"
  | "coupons"
  | "hampers"
  | "analytics"
  | "content"
  | "settings"
  | "staff"
  | "reviews";

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: UserOut | null;
  onLogout: () => void;
  ordersCount: number;
  lowStockCount: number;
}

export default function AdminSidebar({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  ordersCount,
  lowStockCount,
}: AdminSidebarProps) {
  const navSections = [
    {
      group: "Operations",
      items: [
        { id: "overview" as AdminTab, label: "Overview", icon: LayoutDashboard },
        { id: "orders" as AdminTab, label: "Orders", icon: ShoppingBag, badge: ordersCount > 0 ? ordersCount : undefined },
        { id: "whatsapp" as AdminTab, label: "WhatsApp Counter", icon: PhoneCall, highlight: true },
        { id: "customers" as AdminTab, label: "Customers", icon: Users },
      ],
    },
    {
      group: "Catalog & Warehouse",
      items: [
        { id: "products" as AdminTab, label: "Products", icon: Package },
        { id: "inventory" as AdminTab, label: "Inventory", icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} alert` : undefined, badgeColor: "bg-[#D18A24]" },
        { id: "categories" as AdminTab, label: "Categories", icon: Layers },
        { id: "brands" as AdminTab, label: "Brands", icon: Award },
        { id: "hampers" as AdminTab, label: "Gift Hampers", icon: Gift },
      ],
    },
    {
      group: "Marketing & Intelligence",
      items: [
        { id: "coupons" as AdminTab, label: "Coupons & Offers", icon: TicketPercent },
        { id: "analytics" as AdminTab, label: "Reports & Analytics", icon: BarChart3 },
        { id: "content" as AdminTab, label: "Website Content", icon: Globe },
        { id: "reviews" as AdminTab, label: "Customer Reviews", icon: MessageSquareQuote },
      ],
    },
    {
      group: "System & Governance",
      items: [
        { id: "settings" as AdminTab, label: "Store & GST Settings", icon: Settings },
        { id: "staff" as AdminTab, label: "Staff & Permissions", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#1E1815] text-[#FAF8F3] border-r border-[#3B2F26] flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand & Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#3B2F26]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-[#8F1D22] text-[#FAF8F3] font-serif font-bold text-base flex items-center justify-center shadow-md border border-[#C49A50]/40">
              GLP
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="font-serif font-bold text-sm tracking-wide text-[#FAF8F3] truncate">
                  GOOD LUCK PALACE
                </h1>
                <p className="text-[10px] text-[#C49A50] font-mono tracking-wider uppercase">
                  Retail ERP · Est. 1983
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-[#77716A] hover:text-[#FAF8F3] hover:bg-[#292522] transition-colors cursor-pointer hidden md:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Live Storefront Quick Link */}
        <div className="p-2 border-b border-[#3B2F26]/60">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#C49A50] hover:bg-[#C49A50]/10 transition-colors group"
            title="Open customer storefront in new tab"
          >
            <Store size={15} className="shrink-0" />
            {!collapsed && (
              <span className="flex-1 flex items-center justify-between font-medium">
                Live Storefront
                <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="p-2 space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#77716A]">
                  {sec.group}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${
                      isActive
                        ? "bg-[#8F1D22] text-[#FFFFFF] shadow-sm font-semibold"
                        : "text-[#FAF8F3]/80 hover:text-[#FFFFFF] hover:bg-[#292522]"
                    } ${item.highlight && !isActive ? "text-[#258451] hover:text-[#258451]" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={16} className={`shrink-0 ${isActive ? "text-[#FAF8F3]" : item.highlight ? "text-[#258451]" : "text-[#C49A50]"}`} />
                    {!collapsed && (
                      <span className="flex-1 text-left truncate flex items-center justify-between">
                        {item.label}
                        {item.badge !== undefined && (
                          <Badge
                            className={`text-[9px] px-1.5 py-0 h-4 border-0 font-mono ${
                              item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-[#8F1D22] text-white")
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Administrator Profile Card */}
      <div className="p-2 border-t border-[#3B2F26]">
        <div className={`flex items-center gap-2 p-2 rounded-lg bg-[#292522]/80 ${collapsed ? "justify-center" : ""}`}>
          <div className="h-8 w-8 rounded-full bg-[#C49A50] text-[#1E1815] font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#FAF8F3] truncate">
                {user?.name || "Store Administrator"}
              </p>
              <p className="text-[10px] text-[#77716A] truncate">
                {user?.email || "owner@goodluckpalace.com"}
              </p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="p-1.5 rounded hover:bg-[#8F1D22] text-[#77716A] hover:text-white transition-colors cursor-pointer shrink-0"
            title="Log out from Admin Dashboard"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
