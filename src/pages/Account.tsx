import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, MapPin, Package, FileText, Plus, LogOut, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiGet, apiPost } from "@/lib/api";
import { inr } from "@/lib/format";
import { useAppAuth } from "@/lib/authContext";
import type { Order, SavedAddressOut } from "@/lib/types";

export default function Account() {
  const { user, logout, openAuthModal } = useAppAuth();
  const queryClient = useQueryClient();
  const [addrModal, setAddrModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: user?.name || "",
    phone: "",
    line1: "",
    line2: "",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641012",
    landmark: "",
  });

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiGet<Order[]>("/orders"),
    enabled: !!user,
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: typeof newAddr) => apiPost<SavedAddressOut>("/auth/address", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setAddrModal(false);
      toast.success("Delivery address saved!");
    },
    onError: () => toast.error("Could not save address."),
  });

  if (!user) {
    return (
      <div className="paper-grain min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-[#E7E2DA] text-center p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFBEB] text-[#991B1B] mb-3">
            <User className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1C1917]">Customer Sign In</h2>
          <p className="text-xs text-[#57534E] mt-2 mb-6">
            Sign in to view your Good Luck Palace order history, download invoices, and manage saved delivery addresses.
          </p>
          <Button onClick={() => openAuthModal("login")} className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D]">
            Sign In to Your Account
          </Button>
        </Card>
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="paper-grain min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white border-[#E7E2DA] shadow-xs">
          <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#991B1B] font-heading text-xl font-bold text-white shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#1C1917] flex items-center gap-2">
                  {user.name} <Badge variant="outline" className="text-xs uppercase">{user.role}</Badge>
                </h1>
                <p className="text-xs text-[#78716C]">{user.email}</p>
                <p className="text-[11px] text-[#B45309] font-medium mt-0.5">Good Luck Palace Patron · Coimbatore</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={logout} className="border-[#E7E2DA] text-xs flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Section */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-heading text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#991B1B]" /> Your Orders ({orders.length})
            </h2>

            {orders.map((order) => (
              <Card key={order.id} className="bg-white border-[#E7E2DA] overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E2DA] pb-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#1C1917]">{order.order_number}</span>
                      <span className="text-[#78716C] ml-2">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={order.status === "delivered" ? "bg-[#15803D] text-white" : "bg-[#B45309] text-white"}>
                        {order.status.toUpperCase()}
                      </Badge>
                      <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-[#E7E2DA] flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" /> Invoice
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="py-3 space-y-1.5 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[#1C1917]">
                        <span>{item.name} × {item.qty} ({item.unit})</span>
                        <span className="font-mono">{inr(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#E7E2DA] pt-3 flex items-center justify-between text-xs">
                    <span className="text-[#57534E]">Total Amount: <b className="font-mono text-sm text-[#991B1B]">{inr(order.total)}</b></span>
                    <Link to={`/track?number=${order.order_number}`} className="text-[#991B1B] font-semibold hover:underline flex items-center gap-1">
                      Track delivery <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}

            {orders.length === 0 && (
              <div className="bg-white p-8 rounded-lg border border-[#E7E2DA] text-center text-xs text-[#78716C]">
                You have not placed any orders yet.
                <div className="mt-3">
                  <Link to="/groceries">
                    <Button size="sm" className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs">Browse Products</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Saved Addresses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-[#1C1917] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#991B1B]" /> Saved Addresses
              </h2>
              <Button size="sm" variant="outline" onClick={() => setAddrModal(true)} className="h-7 text-xs border-[#E7E2DA]">
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-3">
              {(user.addresses ?? []).map((addr) => (
                <Card key={addr.id} className="bg-white border-[#E7E2DA] p-3 text-xs space-y-1">
                  <p className="font-bold text-[#1C1917]">{addr.full_name}</p>
                  <p className="text-[#57534E] font-mono flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[#B45309]" /> {addr.phone}
                  </p>
                  <p className="text-[#78716C] leading-snug">{addr.line1}, {addr.city} - {addr.pincode}</p>
                </Card>
              ))}

              {(user.addresses ?? []).length === 0 && (
                <div className="bg-white p-6 rounded-lg border border-[#E7E2DA] text-center text-xs text-[#78716C]">
                  No saved addresses. Your address will be saved during checkout.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={addrModal} onOpenChange={setAddrModal}>
        <DialogContent className="max-w-md bg-[#FAF7F2]">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Add Delivery Address</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addAddressMutation.mutate(newAddr);
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs">Full Name *</Label>
              <Input
                value={newAddr.full_name}
                onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contact Phone *</Label>
              <Input
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Address Line *</Label>
              <Input
                value={newAddr.line1}
                onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input value={newAddr.city} disabled className="bg-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pincode *</Label>
                <Input
                  value={newAddr.pincode}
                  onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                  required
                  className="bg-white"
                />
              </div>
            </div>
            <Button type="submit" disabled={addAddressMutation.isPending} className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D] mt-2">
              Save Address
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
