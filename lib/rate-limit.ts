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

// --- Rate limit untuk /api/checkout/resume ---
//
// Beda dari checkout utama: resume TIDAK bikin row order baru, jadi nggak
// bisa dihitung dari tabel orders. Pakai counter in-memory per order sebagai
// gantinya. Catatan jujur: counter ini otomatis reset kalau server function-nya
// "dingin"/restart (wajar di lingkungan serverless), jadi ini bukan proteksi
// sekuat yang di checkout utama. Tapi risikonya juga lebih rendah -- resume
// cuma bisa dipakai untuk order pending milik sendiri, dan Pakasir selalu
// balikin QRIS yang sama persis untuk order_id yang sama -- jadi ini sudah
// cukup untuk mencegah spam biasa tanpa perlu bikin tabel baru di database.
const resumeAttempts = new Map<string, number[]>();
const RESUME_MAX_ATTEMPTS = 5;
const RESUME_WINDOW_MS = 60_000; // 1 menit

export function checkResumeRateLimit(
  userId: string,
  orderId: string
): { allowed: boolean; retryAfterSeconds: number } {
  const key = `${userId}:${orderId}`;
  const now = Date.now();
  const timestamps = (resumeAttempts.get(key) ?? []).filter((t) => now - t < RESUME_WINDOW_MS);

  if (timestamps.length >= RESUME_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((RESUME_WINDOW_MS - (now - timestamps[0])) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  resumeAttempts.set(key, timestamps);
  return { allowed: true, retryAfterSeconds: 0 };
}
