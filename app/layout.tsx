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

export const metadata: Metadata = {
  title: "TanoPedia - Panel WhatsApp & Script Bot Premium",
  description:
    "Beli produk premium panel WhatsApp dan script bot WA untuk kebutuhan bisnis Anda. Harga murah, proses cepat, support 24/7.",
  keywords: [
    "panel whatsapp",
    "script bot wa",
    "bot whatsapp",
    "broadcast wa",
    "auto reply whatsapp",
  ],
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
