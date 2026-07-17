import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ProductsSection } from "@/components/products-section";
import { FAQSection } from "@/components/faq-section";
import { FooterSection } from "@/components/footer-section";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <FAQSection />
      <FooterSection />
      <FloatingWhatsApp />
    </main>
  );
}
