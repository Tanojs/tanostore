/** @type {import('next').NextConfig} */

// Ambil hostname dari Supabase URL sendiri, supaya optimasi gambar Next.js
// cuma mengizinkan gambar dari Storage bucket kita sendiri (product-images),
// bukan sembarang domain luar.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  // ignoreBuildErrors DIHAPUS: sebelumnya di-set true, artinya build tetap
  // "sukses" & ke-deploy walau ada bug tipe data. Sekarang error TypeScript
  // beneran menghentikan build, biar bug ketauan sebelum nyampe production.
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
}

export default nextConfig
