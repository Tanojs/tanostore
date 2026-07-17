"use client";

import { useState } from "react";
import { ChevronRight, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Bagaimana cara memesan produk?",
    answer: "Klik tombol Beli atau Order pada produk yang diinginkan, isi form checkout, lakukan pembayaran, dan produk akan segera diproses.",
  },
  {
    question: "Berapa lama pesanan diproses?",
    answer: "Pesanan diproses maksimal 1x24 jam setelah pembayaran dikonfirmasi. Biasanya dalam hitungan menit hingga beberapa jam.",
  },
  {
    question: "Apakah pembayaran aman?",
    answer: "Ya, pembayaran 100% aman. Kami menerima transfer bank, QRIS, dan e-wallet. Semua transaksi tercatat dengan baik.",
  },
  {
    question: "Bagaimana jika pesanan saya gagal atau tidak muncul?",
    answer: "Hubungi admin via WhatsApp dengan menyertakan bukti pembayaran. Kami akan segera membantu menyelesaikan masalah Anda.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-8 bg-background text-foreground px-3 sm:px-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-[#6C3CE1]" />
            <h2 className="text-lg font-bold text-foreground">Pertanyaan Umum</h2>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">Jawaban untuk pertanyaan yang sering ditanyakan</p>
        </div>

        {/* FAQ List Tano Pedia Card Style */}
        <div className="bg-card border border-border rounded-[20px] overflow-hidden shadow-xl transition-colors duration-300">
          {faqs.map((faq, index) => (
            <div key={index} className={index !== faqs.length - 1 ? "border-b border-border" : ""}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#6c3ce1]/5 transition-colors gap-3 cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-bold">
                  <ChevronRight
                    className={`w-4 h-4 text-[#6C3CE1] transition-transform flex-shrink-0 ${
                      openIndex === index ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-left">{faq.question}</span>
                </span>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 pl-10">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
