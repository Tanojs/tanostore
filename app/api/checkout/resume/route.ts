import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orderId = body?.order_id;

    if (!orderId) {
      return NextResponse.json({ error: "order_id tidak valid" }, { status: 400 });
    }

    // RLS memastikan user cuma bisa ambil order miliknya sendiri.
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, order_seq, status, total_price")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (orderData.status !== "pending") {
      return NextResponse.json(
        { error: "Pesanan ini sudah tidak berstatus pending, tidak bisa dibayar ulang." },
        { status: 409 }
      );
    }

    // Referensi order_id yang sama persis dengan yang dipakai saat order dibuat pertama
    // kali — Pakasir akan mengenali ini sebagai transaksi yang sama dan tetap
    // mengembalikan QRIS yang valid untuk dibayar.
    const pakasirOrderId = `TANO-${orderData.order_seq}`;

    try {
      const res = await fetch("https://app.pakasir.com/api/transactioncreate/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: process.env.PAKASIR_PROJECT,
          order_id: pakasirOrderId,
          amount: Number(orderData.total_price),
          api_key: process.env.PAKASIR_API_KEY,
        }),
      });

      const pData = await res.json();
      if (!pData?.payment?.payment_number) {
        throw new Error("Gagal mendapatkan kode QRIS dari Pakasir");
      }

      return NextResponse.json({
        success: true,
        qrString: pData.payment.payment_number,
        order_id: orderData.id,
        total_price: orderData.total_price,
      });
    } catch (pakasirError: any) {
      console.error("Pakasir API Error (resume):", pakasirError.message);
      return NextResponse.json(
        { error: "Gagal memuat ulang kode pembayaran, silakan coba lagi." },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Resume Checkout API Error:", err.message);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
