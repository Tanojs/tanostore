import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanostore.vercel.app";

// Next.js otomatis meng-generate /sitemap.xml dari file ini.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pakai anon key (bukan service role) karena sitemap memang untuk data publik.
  // RLS di tabel products otomatis cuma mengembalikan produk yang is_active = true
  // (lihat kebijakan "products_select" di supabase/schema.sql).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${siteUrl}/product/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Cuma halaman publik yang masuk sitemap — halaman yang wajib login
  // (checkout, profile, cek-order, admin) sengaja tidak dimasukkan.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticEntries, ...productEntries];
}
