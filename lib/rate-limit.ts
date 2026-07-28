import type { SupabaseClient } from "@supabase/supabase-js";

// Batas anti-spam order: tiap order baru = 1 row di tabel `orders` + 1 panggilan
// API Pakasir (generate QRIS). Tanpa batas ini, satu user bisa spam bikin order
// pending berkali-kali dalam hitungan detik -> tabel orders penuh sampah dan
// kuota API Pakasir kita boros percuma.
const MAX_ORDERS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

export async function checkCheckoutRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; retryAfterMinutes: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  // Hitung berapa banyak order (apapun statusnya) yang dibuat user ini dalam
  // beberapa menit terakhir. RLS tetap berlaku di sini karena pakai client
  // biasa (bukan service role), jadi otomatis cuma menghitung order milik
  // user yang sedang login.
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  // Kalau query rate-limit-nya sendiri gagal (misal masalah jaringan sesaat),
  // jangan sampai memblokir user membeli -> fail-open, bukan fail-closed.
  if (error) {
    console.error("Rate limit check error:", error.message);
    return { allowed: true, retryAfterMinutes: 0 };
  }

  if ((count ?? 0) >= MAX_ORDERS_PER_WINDOW) {
    return { allowed: false, retryAfterMinutes: WINDOW_MINUTES };
  }

  return { allowed: true, retryAfterMinutes: 0 };
}
