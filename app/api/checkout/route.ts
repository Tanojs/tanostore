import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MAX_QTY = 10;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. WAJIB LOGIN — ambil user dari session cookie, bukan dari body request
    //    (body request bisa dipalsukan, cookie session tidak bisa).
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu untuk melakukan pembelian." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productId = body?.product?.id;
    const customerName = String(body?.customerName ?? "").trim();
    const whatsappNumber = String(body?.whatsappNumber ?? "").trim();
    const quantity = Number(body?.quantity);

    if (!productId) {
      return NextResponse.json({ error: "Produk tidak valid" }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ error: "Nama pembeli wajib diisi" }, { status: 400 });
    }
    if (!whatsappNumber || whatsappNumber.length < 8) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      return NextResponse.json(
        { error: `Jumlah beli harus antara 1 - ${MAX_QTY}` },
        { status: 400 }
      );
    }

    // 2. AMBIL DETAIL PRODUK (hanya produk aktif yang bisa dibeli, ditegakkan oleh RLS)
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id, price, delivery_type")
      .eq("id", productId)
      .single();

    if (productError || !productData) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // 3. CEK STOK REAL-TIME (lewat view products_with_stock, aman dari RLS product_items)
    if (productData.delivery_type === "account") {
      const { data: stockRow } = await supabase
        .from("products_with_stock")
        .select("stock")
        .eq("id", productId)
        .single();

      const availableStock = stockRow?.stock ?? 0;
      if (availableStock < quantity) {
        return NextResponse.json(
          { error: `Stok tersisa ${availableStock}, tidak mencukupi untuk jumlah yang diminta.` },
          { status: 409 }
        );
      }
    }

    const totalAmount = Number(productData.price) * quantity;

    // 4. SIMPAN ORDER BARU (status pending). RLS memastikan user_id = user yang login
    //    dan status yang boleh di-insert hanya 'pending' — lihat supabase/schema.sql.
    const { data: orderData, error: insertError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: user.id,
          product_id: productData.id,
          quantity,
          unit_price: productData.price,
          total_price: totalAmount,
          customer_name: customerName,
          whatsapp: whatsappNumber,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (insertError || !orderData) {
      console.error("Gagal simpan order:", insertError);
      return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
    }

    // 5. PANGGIL API PAKASIR UNTUK GENERATE QRIS
    try {
      const res = await fetch("https://app.pakasir.com/api/transactioncreate/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: process.env.PAKASIR_PROJECT,
          order_id: orderData.id,
          amount: totalAmount,
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
      });
    } catch (pakasirError: any) {
      // Gagal membuat tagihan QRIS -> batalkan order pending ini supaya tidak
      // menggantung (kebijakan RLS mengizinkan pemilik order membatalkan order
      // miliknya sendiri selama masih berstatus 'pending').
      console.error("Pakasir API Error:", pakasirError.message);
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderData.id);
      return NextResponse.json(
        { error: "Gagal membuat kode pembayaran, silakan coba lagi." },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Checkout API Error:", err.message);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
