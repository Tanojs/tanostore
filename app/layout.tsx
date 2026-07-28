import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll"; 
import { ThemeProvider } from "@/components/theme-provider"; 
import { BottomNav } from "@/components/BottomNav"; // <-- Import BottomNav yang baru dibuat

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanostore.vercel.app";
const siteTitle = "TanoPedia - Panel WhatsApp & Script Bot Premium";
const siteDescription =
  "Beli produk premium panel WhatsApp dan script bot WA untuk kebutuhan bisnis Anda. Harga murah, proses cepat, support 24/7.";

export const metadata: Metadata = {
  // Dasar untuk resolve URL relatif (og:image, sitemap, dll) -> WAJIB diisi
  // env NEXT_PUBLIC_SITE_URL dengan domain asli di Vercel, lihat .env.example.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    // Halaman lain tinggal set title: "Nama Produk" -> otomatis jadi
    // "Nama Produk | TanoPedia" di tab browser & hasil pencarian.
    template: "%s | TanoPedia",
  },
  description: siteDescription,
  keywords: [
    "panel whatsapp",
    "script bot wa",
    "bot whatsapp",
    "broadcast wa",
    "auto reply whatsapp",
  ],
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "TanoPedia",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c1e", 
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      {/* pb-16 memastikan konten terbawah aman di HP, sm:pb-0 mengembalikannya ke normal di laptop */}
      <body className={`${inter.variable} font-sans antialiased pb-16 sm:pb-0`}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false}
        >
          <SmoothScroll>
            {children}
          </SmoothScroll>
          
          {/* Navigasi Bawah nangkring di sini agar aktif secara global */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
