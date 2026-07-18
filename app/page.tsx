import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ProductsSection } from "@/components/products-section";
import { FAQSection } from "@/components/faq-section";
import { FooterSection } from "@/components/footer-section";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";

export default function Home() {
  return (
    <main className="bg-background">
      <Navbar />
      <HeroSection />
      <ProductsSection />
      <FAQSection />
      <FooterSection />
      <FloatingWhatsApp />
    </main>
  );
}