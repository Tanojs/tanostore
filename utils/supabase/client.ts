import { createBrowserClient } from "@supabase/ssr";

// Client Supabase untuk dipakai di komponen "use client".
// Selalu pakai NEXT_PUBLIC_SUPABASE_ANON_KEY (bukan service role!) di sisi browser,
// karena kunci ini akan terlihat oleh siapa saja yang membuka website.
// Keamanan data diatur lewat Row Level Security (lihat supabase/schema.sql).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
