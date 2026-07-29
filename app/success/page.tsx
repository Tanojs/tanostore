"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Copy, Check, ArrowRight } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { AccountDataDisplay } from "@/components/account-data-display";

const supabase = createClient();

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    supabase
      .from('orders')
      .select('id, order_seq, status, account_data')
      .eq('id', orderId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setOrder(data);
        }
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground text-sm">Memuat data...</div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full mx-auto bg-card border border-border rounded-3xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400">Pesanan tidak ditemukan</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Pastikan Anda login dengan akun yang sama saat melakukan pembelian.
          </p>
          <Link href="/cek-order" className="mt-4 inline-block text-purple-600 dark:text-purple-400 font-bold text-sm">
            Lihat riwayat pesanan saya →
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const invoiceId = `TANO-${order.order_seq}`;

  const handleCopyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(invoiceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Diamkan kalau clipboard API gagal.
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full mx-auto bg-card border border-border rounded-3xl shadow-lg p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex items-center justify-center size-14 rounded-2xl mb-4 ${
              isPaid ? "bg-green-500/10" : "bg-amber-500/10"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="text-green-600 dark:text-green-400" size={28} />
            ) : (
              <Clock className="text-amber-500 dark:text-amber-400" size={28} />
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isPaid ? "Pembayaran Berhasil!" : "Menunggu Konfirmasi Pembayaran"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isPaid
              ? "Terima kasih, pesanan kamu sudah kami proses."
              : "Status akan otomatis ter-update begitu pembayaran terkonfirmasi."}
          </p>

          <button
            type="button"
            onClick={handleCopyInvoice}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-muted/70 transition-colors cursor-pointer"
          >
            {invoiceId}
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div className="mt-6">
          {isPaid ? (
            <>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                Detail Produk / Tautan Anda
              </p>
              <AccountDataDisplay data={order.account_data} />
            </>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 text-center">
              Belum ada pembayaran yang terkonfirmasi untuk pesanan ini.
            </div>
          )}
        </div>

        <Link
          href="/cek-order"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline"
        >
          Lihat semua pesanan saya <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SuccessContent />
    </Suspense>
  );
}
