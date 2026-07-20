"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const supabase = createClient();

const MAX_QTY = 10;

interface Product {
  id: string;
  title: string;
  description: string | null;
  category_name: string | null;
  delivery_type: "account" | "file";
  price: number;
  stock: number | null; // null = tidak terbatas (produk tipe file)
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id") || "";
  const resumeOrderId = searchParams.get("resume") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [qrString, setQrString] = useState<string>("");
  const [qrTotal, setQrTotal] = useState<number>(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<"expired" | "cancelled" | null>(null);

  // Mode "lanjutkan pembayaran": order sudah ada (dari riwayat pesanan), tinggal
  // minta ulang QRIS-nya ke Pakasir, tanpa perlu isi form dari awal lagi.
  const [resuming, setResuming] = useState<boolean>(!!resumeOrderId);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeOrderId) return;

    async function resumePayment() {
      try {
        const res = await fetch("/api/checkout/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: resumeOrderId }),
        });
        const data = await res.json();

        if (data.success) {
          setQrString(data.qrString);
          setQrTotal(Number(data.total_price));
          setOrderId(data.order_id);
        } else {
          setResumeError(data.error || "Gagal memuat ulang pembayaran");
        }
      } catch (err: any) {
        setResumeError("Terjadi kesalahan: " + err.message);
      } finally {
        setResuming(false);
      }
    }

    resumePayment();
  }, [resumeOrderId]);

  useEffect(() => {
    if (resumeOrderId) {
      // Mode resume tidak perlu fetch data produk, cukup nunggu QR dari resumePayment().
      setLoadingProduct(false);
      return;
    }

    async function fetchProduct() {
      if (!productId) {
        setLoadingProduct(false);
        return;
      }

      // products_with_stock: view publik dengan stok yang sudah dihitung aman
      const { data, error } = await supabase
        .from('products_with_stock')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !data) {
        console.error("Produk tidak ditemukan:", error);
        setProduct(null);
      } else {
        setProduct(data);
        const outOfStock = data.delivery_type === "account" && (data.stock ?? 0) <= 0;
        setQuantity(outOfStock ? 0 : 1);
      }
      setLoadingProduct(false);
    }

    fetchProduct();
  }, [productId, resumeOrderId]);

  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      // Cek dulu apakah order ini sudah lewat batas waktu pembayaran (10 menit),
      // kalau iya otomatis ditandai 'expired' oleh fungsi ini.
      await supabase.rpc('expire_order_if_stale', { p_order_id: orderId });

      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (data?.status === 'paid') {
        router.push(`/success?order_id=${orderId}`);
      } else if (data?.status === 'expired' || data?.status === 'cancelled') {
        setOrderStatus(data.status);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    if (!confirm("Batalkan pesanan ini?")) return;

    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (!error) {
      setOrderStatus('cancelled');
    }
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      alert("Masukkan nama lengkap!");
      return;
    }
    if (!whatsappNumber.trim()) {
      alert("Masukkan nomor WhatsApp!");
      return;
    }
    if (quantity < 1) {
      alert("Minimal beli 1!");
      return;
    }
    if (!product) {
      alert("Produk tidak ditemukan!");
      return;
    }
    if (product.delivery_type === "account" && quantity > (product.stock ?? 0)) {
      alert(`Stok tersisa ${product.stock}, tidak bisa beli lebih dari itu.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: quantity,
          whatsappNumber: whatsappNumber,
          customerName: customerName,
          product: {
            id: product.id,
          }
        })
      });

      const data = await res.json();

      if (data.success) {
        setQrString(data.qrString);
        setQrTotal(product.price * quantity);
        setOrderId(data.order_id);
      } else {
        alert(data.error || "Gagal memproses pembayaran");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (resuming) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">Memuat ulang kode pembayaran...</div>
      </div>
    );
  }

  if (resumeError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <h2 className="font-bold text-xl text-red-600 dark:text-red-400">Gagal Memuat Pembayaran</h2>
          <p className="text-muted-foreground text-sm mt-2">{resumeError}</p>
          <Link href="/cek-order" className="mt-4 inline-block text-purple-600 dark:text-purple-400 font-bold text-sm">
            ← Kembali ke Riwayat Pesanan
          </Link>
        </div>
      </div>
    );
  }

  if (qrString) {
    if (orderStatus === "expired" || orderStatus === "cancelled") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border border-border p-8 rounded-3xl shadow-xl text-center w-full max-w-sm">
            <h2 className="font-bold text-xl text-red-600 dark:text-red-400">
              {orderStatus === "expired" ? "Waktu Pembayaran Habis" : "Pesanan Dibatalkan"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {orderStatus === "expired"
                ? "Pesanan ini otomatis dibatalkan karena melebihi batas waktu pembayaran (10 menit)."
                : "Kamu sudah membatalkan pesanan ini."}
            </p>
            <Link href="/" className="mt-6 inline-block text-purple-600 dark:text-purple-400 font-bold text-sm">
              ← Kembali ke Home
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl text-center w-full max-w-sm">
          <h2 className="font-bold text-xl mb-4 text-foreground">Scan QRIS</h2>
          <div className="border-2 border-dashed border-border p-4 rounded-2xl mb-4 bg-white w-fit mx-auto">
            <div className="w-[min(200px,60vw)] aspect-square">
              <QRCodeSVG value={qrString} size={200} className="w-full h-full" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Menunggu pembayaran...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Total: Rp {qrTotal.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Bayar dalam 10 menit, atau pesanan otomatis dibatalkan.
          </p>
          <button
            onClick={handleCancelOrder}
            className="mt-4 text-red-500 dark:text-red-400 font-bold text-xs cursor-pointer block mx-auto"
          >
            Batalkan Pesanan
          </button>
          <button
            onClick={() => router.push("/")}
            className="mt-3 text-purple-600 dark:text-purple-400 font-bold text-sm cursor-pointer"
          >
            ← Kembali ke Home
          </button>
        </div>
      </div>
    );
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">Memuat produk...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <h2 className="font-bold text-xl text-red-600 dark:text-red-400">Produk tidak ditemukan</h2>
          <p className="text-muted-foreground text-sm mt-2">ID: {productId}</p>
          <Link href="/" className="mt-4 inline-block text-purple-600 dark:text-purple-400 font-bold text-sm">
            ← Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.delivery_type === "account" && (product.stock ?? 0) <= 0;
  const maxQty = product.delivery_type === "account" ? Math.min(product.stock ?? 0, MAX_QTY) : MAX_QTY;

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-lg p-6">
          <h1 className="text-xl font-bold text-foreground mb-6">🛒 Detail Pesanan</h1>

          <div className="border border-border rounded-2xl p-4 mb-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">ITEM DIPILIH</p>
            <p className="font-bold text-lg text-foreground">{product.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{product.description || "Produk digital"}</p>
          </div>

          <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
            <span className="text-sm font-semibold text-muted-foreground">HARGA SATUAN</span>
            <span className="font-bold text-foreground">Rp {product.price.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <span className="text-sm font-semibold text-muted-foreground">JUMLAH BELI</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 text-foreground text-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                -
              </button>
              <span className="text-xl font-bold w-8 text-center text-foreground">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty || isOutOfStock}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 text-foreground text-xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-4 mb-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">METODE PEMBAYARAN</p>
            <p className="font-bold text-purple-700 dark:text-purple-400">QRIS (Otomatis)</p>
            <p className="text-xs text-muted-foreground mt-1">Scan via DANA, GoPay, OVO, ShopeePay, dll.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-muted-foreground mb-1">NAMA PEMBELI</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm bg-muted text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-muted-foreground mb-1">NOMOR WHATSAPP AKTIF</label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="62812xxxxxx"
              className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm bg-muted text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4 mb-6">
            <span className="text-sm font-bold text-muted-foreground">TOTAL BAYAR</span>
            <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              Rp {(product.price * quantity).toLocaleString("id-ID")}
            </span>
          </div>

          {isOutOfStock && (
            <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-xl mb-4 border border-red-200 dark:border-red-500/20">
              <p className="text-red-600 dark:text-red-400 text-sm font-bold text-center">⚠️ Stok produk ini habis!</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-bold text-center hover:bg-muted transition"
            >
              BATAL
            </Link>
            <button
              onClick={handleCheckout}
              disabled={loading || isOutOfStock}
              className={`flex-1 py-3 rounded-xl text-white font-bold transition-all cursor-pointer ${
                isOutOfStock
                  ? "bg-muted-foreground/40 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:scale-95"
              }`}
            >
              {loading ? "Memproses..." : isOutOfStock ? "STOK HABIS" : "BELI SEKARANG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
