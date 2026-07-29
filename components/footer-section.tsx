"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Send } from "lucide-react";

const WHATSAPP_NUMBER = "6285701961876";
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbCUCFf5a24DCL3z4W40";

const columns = [
  {
    title: "Produk",
    links: [
      { label: "Produk", href: "/#products" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Chat Admin", href: `https://wa.me/${WHATSAPP_NUMBER}`, external: true },
      { label: "Channel WA", href: WHATSAPP_CHANNEL, external: true },
      { label: "Cek Pesanan", href: "/cek-order" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Syarat", href: "/terms" },
      { label: "Privasi", href: "/privacy" },
    ],
  },
];

const socials = [
  { icon: MessageCircle, href: `https://wa.me/${WHATSAPP_NUMBER}`, label: "Chat WhatsApp" },
  { icon: Send, href: WHATSAPP_CHANNEL, label: "Channel WhatsApp" },
];

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-16">
        {/* Logo + tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C3CE1] to-[#a855f7] flex items-center justify-center shadow-lg overflow-hidden shrink-0">
            <Image src="/images/logo.png" alt="Logo" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className="text-2xl font-black text-foreground">
            Tano<span className="bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] bg-clip-text text-transparent">Pedia</span>
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Panel WhatsApp &amp; Script Bot Premium.</p>

        {/* Ikon sosial */}
        <div className="flex items-center gap-3 mt-6">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-11 h-11 rounded-2xl border border-border flex items-center justify-center text-foreground hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        {/* 3 kolom link */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-semibold text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border mt-12 pt-6">
          <p className="text-[11px] tracking-widest uppercase text-muted-foreground">
            &copy; {currentYear} TanoPedia. Semua hak cipta dilindungi.
          </p>
        </div>

        {/* Wordmark besar */}
        <div className="mt-8 select-none overflow-hidden">
          <p className="text-center text-6xl sm:text-8xl md:text-9xl leading-none font-black bg-gradient-to-b from-[#6C3CE1] to-[#a855f7]/30 bg-clip-text text-transparent">
            TanoPedia
          </p>
        </div>
      </div>
    </footer>
  );
}
