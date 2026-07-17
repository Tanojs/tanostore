"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Package, CheckCircle2, Clock, XCircle } from "lucide-react";

const supabase = createClient();

interface OrderRow {
  id: string;
  status: string;
  quantity: number;
  total_price: number;
  account_data: string | null;
  created_at: string;
  products: { title: string } | null;
}

export default function CekOrderPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    async function fetchMyOrders() {
      // RLS hanya mengizinkan user melihat order miliknya sendiri (auth.uid() = user_id),
      // jadi query ini otomatis aman tanpa perlu parameter tambahan.
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, quantity, total_price, account_data, created_at, products(title)")
        .order("created_at", { ascending: false });

      if (!error && data) setOrders(data as any);
      setLoading(false);
    }
    fetchMyOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return {
          className: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
          icon: <CheckCircle2 size={12} />,
          label: "Sudah Dibayar",
        };
      case "pending":
        return {
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          icon: <Clock size={12} />,
          label: "Menunggu Pembayaran",
        };
      default:
        return {
          className: "bg-muted text-muted-foreground border border-border",
          icon: <XCircle size={12} />,
          label: status === "expired" ? "Kedaluwarsa" : "Gagal",
        };
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Riwayat Pesanan Saya 🧾</h2>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Memuat pesanan...
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground">Anda belum pernah melakukan pemesanan.</p>
          ) : (
            orders.map((o) => {
              const badge = getStatusBadge(o.status);
              return (
                <div key={o.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Invoice ID</p>
                        <p className="font-black text-foreground">#{o.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${badge.className}`}>
                      {badge.icon}
                      {badge.label}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="font-bold text-foreground">{o.products?.title || "Produk"}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Jumlah: {o.quantity} pcs</p>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                      Total: Rp {Number(o.total_price).toLocaleString("id-ID")}
                    </p>
                  </div>

                  {o.status === "paid" && (
                    <div className="mt-4 p-3 bg-muted rounded-xl border border-border text-xs font-mono text-foreground break-all whitespace-pre-line">
                      <p className="font-sans font-bold text-muted-foreground mb-1">🎁 Data Pesanan Anda:</p>
                      {o.account_data || "Data sedang disiapkan..."}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
