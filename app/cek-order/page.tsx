"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Package, CheckCircle2, Clock, XCircle, QrCode, Search, Ban } from "lucide-react";

const supabase = createClient();

interface OrderRow {
  id: string;
  order_seq: number;
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchMyOrders() {
      // Cek dulu apakah ada order pending milik user yang sudah lewat batas
      // waktu pembayaran (10 menit) — kalau ada, otomatis ditandai 'expired'.
      await supabase.rpc("expire_all_stale_orders");

      // RLS hanya mengizinkan user melihat order miliknya sendiri (auth.uid() = user_id),
      // jadi query ini otomatis aman tanpa perlu parameter tambahan.
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_seq, status, quantity, total_price, account_data, created_at, products(title)")
        .order("created_at", { ascending: false });

      if (!error && data) setOrders(data as any);
      setLoading(false);
    }
    fetchMyOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Batalkan pesanan ini?")) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const invoice = `tano-${o.order_seq}`.toLowerCase();
      const title = (o.products?.title || "").toLowerCase();
      return invoice.includes(q) || String(o.order_seq).includes(q) || title.includes(q);
    });
  }, [orders, searchQuery]);

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
      case "cancelled":
        return {
          className: "bg-muted text-muted-foreground border border-border",
          icon: <Ban size={12} />,
          label: "Dibatalkan",
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

        {!loading && orders.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari invoice atau nama produk..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Memuat pesanan...
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground">Anda belum pernah melakukan pemesanan.</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-center text-muted-foreground">Tidak ada pesanan yang cocok dengan pencarian.</p>
          ) : (
            filteredOrders.map((o) => {
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
                        <p className="font-black text-foreground">TANO-{o.order_seq}</p>
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

                  {o.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/checkout?resume=${o.id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white text-sm font-bold py-2.5 rounded-xl active:scale-95 transition-all"
                      >
                        <QrCode size={16} />
                        Lanjutkan
                      </Link>
                      <button
                        onClick={() => handleCancelOrder(o.id)}
                        className="px-4 flex items-center justify-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                      >
                        <Ban size={16} />
                      </button>
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
