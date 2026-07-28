import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanostore.vercel.app";

// Next.js otomatis meng-generate /robots.txt dari file ini, tidak perlu file
// static robots.txt manual di folder public/.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Halaman-halaman ini butuh login / tidak relevan untuk di-index Google.
      disallow: ["/admin", "/checkout", "/profile", "/cek-order", "/login", "/reset-password", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
