/** @type {import('next').NextConfig} */

// Ambil hostname dari Supabase URL sendiri, supaya optimasi gambar Next.js
// cuma mengizinkan gambar dari Storage bucket kita sendiri (product-images),
// bukan sembarang domain luar.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
