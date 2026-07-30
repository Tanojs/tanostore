"use client";

import Link from "next/link";
import Image from "next/image";

const WHATSAPP_NUMBER = "6285701961876";
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbCUCFf5a24DCL3z4W40";
const TELEGRAM_URL = "https://t.me/Tanoxjs";

// Logo asli WhatsApp & Telegram sebagai SVG inline -- lucide-react (icon set
// yang dipakai di seluruh web ini) sengaja tidak menyediakan logo brand,
// cuma icon generic. Jadi 2 logo ini dibikin manual biar bentuknya bener-bener
// sesuai logo aslinya, bukan icon "kirim pesan" generic.
function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26C2.168 6.443 6.603 2.008 12.055 2.008c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0a12 12 0 100 24 12 12 0 000-24m5.568 8.16c-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23a.246.246 0 00-.056-.212c-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472" />
    </svg>
  );
}

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
  {
    icon: WhatsAppLogo,
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    label: "WhatsApp",
    colorClass: "hover:border-[#25D366] hover:text-[#25D366]",
  },
  {
    icon: TelegramLogo,
    href: TELEGRAM_URL,
    label: "Telegram",
    colorClass: "hover:border-[#26A5E4] hover:text-[#26A5E4]",
  },
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
            Tano <span className="bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] bg-clip-text text-transparent">Store</span>
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Panel WhatsApp &amp; Script Bot Premium.</p>

        {/* Ikon sosial */}
        <div className="flex items-center gap-3 mt-6">
          {socials.map(({ icon: Icon, href, label, colorClass }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`w-11 h-11 rounded-2xl border border-border flex items-center justify-center text-foreground transition-colors ${colorClass}`}
            >
              <Icon className="w-[18px] h-[18px]" />
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
            &copy; {currentYear} Tano Store. Semua hak cipta dilindungi.
          </p>
        </div>

        {/* Wordmark besar */}
        <div className="mt-8 select-none overflow-hidden">
          <p className="text-center text-5xl sm:text-7xl md:text-8xl leading-none font-black bg-gradient-to-b from-[#6C3CE1] to-[#a855f7]/30 bg-clip-text text-transparent">
            Tano Store
          </p>
        </div>
      </div>
    </footer>
  );
}
