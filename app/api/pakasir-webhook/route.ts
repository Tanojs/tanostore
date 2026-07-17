import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";

// Client dengan Service Role Key: dipakai KHUSUS di webhook karena tidak ada
// sesi user (Pakasir yang memanggil endpoint ini, bukan user browser).
// Query di sini bypass RLS, jadi semua validasi dilakukan manual di kode ini.
const supabase = createServiceRoleClient();

async function verifyWithPakasir(orderId: string, amount: number) {
  // Sesuai rekomendasi resmi Pakasir: JANGAN percaya begitu saja payload webhook
  // yang masuk (bisa dipalsukan siapa saja karena tidak ditandatangani/signed).
  // Selalu cek ulang status transaksi lewat Transaction Detail API mereka
  // menggunakan API Key rahasia kita sendiri.
  const params = new URLSearchParams({
    project: process.env.PAKASIR_PROJECT ?? "",
    amount: String(amount),
    order_id: orderId,
    api_key: process.env.PAKASIR_API_KEY ?? "",
  });

  const res = await fetch(`https://app.pakasir.com/api/transactiondetail?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json?.transaction ?? null;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Webhook Pakasir diterima:", JSON.stringify(payload));

    const orderId = payload?.order_id;
    if (!orderId) {
      return NextResponse.json({ error: "order_id tidak ada" }, { status: 400 });
    }

    // Webhook Pakasir hanya relevan untuk kita jika statusnya 'completed'.
    // Status lain (pending/failed) tidak perlu diproses di sini.
    if (payload?.status !== "completed") {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 1. Ambil order dari database kita
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, status, total_price")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      console.error("Webhook: order tidak ditemukan ->", orderId);
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // 2. Sudah pernah diproses sebelumnya? Berhenti di sini (idempotent, hemat
    //    panggilan ke API Pakasir kalau webhook mereka terkirim ulang).
    if (orderData.status !== "pending") {
      return NextResponse.json({ success: true, message: "Order sudah diproses" }, { status: 200 });
    }

    // 3. VERIFIKASI ULANG ke server Pakasir — pertahanan utama terhadap webhook
    //    palsu. Hanya lanjut jika Pakasir SENDIRI mengonfirmasi status completed
    //    dan nominalnya sesuai dengan tagihan order ini.
    const verifiedTransaction = await verifyWithPakasir(orderId, Number(orderData.total_price));

    if (!verifiedTransaction || verifiedTransaction.status !== "completed") {
      console.error("Webhook: verifikasi ke Pakasir gagal / belum completed untuk order", orderId);
      return NextResponse.json(
        { error: "Verifikasi transaksi ke Pakasir gagal" },
        { status: 202 }
      );
    }

    if (Number(verifiedTransaction.amount) !== Number(orderData.total_price)) {
      console.error(
        `Webhook: nominal tidak cocok untuk order ${orderId}. Diharapkan ${orderData.total_price}, dari Pakasir ${verifiedTransaction.amount}`
      );
      return NextResponse.json({ error: "Nominal pembayaran tidak sesuai" }, { status: 409 });
    }

    // 4. Lunas terverifikasi -> jalankan fulfillment yang ATOMIC lewat fungsi
    //    database fulfill_order() (kunci baris, alokasi stok anti race condition,
    //    dan idempotent — lihat supabase/schema.sql).
    const { error: rpcError } = await supabase.rpc("fulfill_order", {
      p_order_id: orderId,
      p_verified_amount: verifiedTransaction.amount,
    });

    if (rpcError) {
      console.error("Webhook: fulfill_order gagal ->", rpcError.message);
      return NextResponse.json({ error: "Gagal memproses pesanan" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
