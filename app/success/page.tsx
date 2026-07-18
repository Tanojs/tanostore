"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground p-10 text-center">Memuat data...</div>;

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full mx-auto bg-card border border-border rounded-3xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">Berhasil!</h1>
        <p className="mt-4 text-muted-foreground">Nomor Pesanan:</p>
        <div className="text-xl font-black text-purple-600 dark:text-purple-400 my-2 break-all">TANO-{order.order_seq}</div>

        <div className="mt-6 p-4 bg-muted rounded-xl">
          {order.status === 'paid' ? (
            <div>
              <div className="text-green-600 dark:text-green-400 font-bold mb-3">🟢 Pembayaran Sukses!</div>
              <div className="text-sm text-muted-foreground mb-1 font-semibold text-left">Detail Produk / Tautan Anda:</div>
              <pre className="p-3 bg-card border border-border rounded-lg text-left break-all font-mono text-sm whitespace-pre-wrap text-foreground">
                {order.account_data || "Sedang menyiapkan produk... Mohon tunggu atau muat ulang halaman."}
              </pre>
            </div>
          ) : (
            <span className="text-amber-500 dark:text-amber-400 font-bold">🟡 Menunggu konfirmasi pembayaran...</span>
          )}
        </div>
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
