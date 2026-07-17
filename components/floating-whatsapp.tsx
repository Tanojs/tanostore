"use client";

import { Headphones, MessageCircle, Send, X } from "lucide-react";
import { motion, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const WHATSAPP_NUMBER = "6285701961876";
const TELEGRAM_BOT_URL = "https://t.me/tanoxds"; // <-- GANTI DENGAN LINK BOT TELEGRAM KAMU DI SINI

export function FloatingWhatsApp() {
  const controls = useAnimation();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State untuk buka/tutup mini menu
  const [isLeft, setIsLeft] = useState(false); // State untuk mendeteksi posisi kiri/kanan layar

  // Pastikan window sudah tersedia (Client Side)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const width = window.innerWidth;
    const endX = info.point.x;

    const edgeOffset = 20;
    const buttonWidth = 48; 

    let targetX = 0;

    // Logika Snap ke pinggir terdekat
    if (endX > width / 2) {
      // Kembali ke posisi kanan asli
      targetX = 0;
      setIsLeft(false);
    } else {
      // Lompat ke sisi kiri layar
      targetX = -(width - (edgeOffset * 2) - buttonWidth);
      setIsLeft(true);
    }

    controls.start({
      x: targetX,
      transition: { 
        type: "spring", 
        stiffness: 250, 
        damping: 25 
      },
    });
  };

  if (!isMounted) return null;

  return (
    // 📌 PERUBAHAN: Mengubah 'bottom-5' menjadi 'bottom-24' agar berada di atas bottom navigation
    <div className="fixed bottom-24 right-5 z-50 flex flex-col items-center">
      
      {/* 🔮 MINI POP-UP MENU PILIHAN HUBUNGI KAMI */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.85 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute bottom-14 bg-card border border-border p-2.5 rounded-2xl shadow-2xl flex flex-col gap-2 w-44 z-50 ${
              isLeft ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"
            }`}
          >
            {/* Pilihan WhatsApp */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo, saya mau tanya tentang produk`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wide cursor-pointer"
            >
              <div className="p-1 bg-[#25D366] text-white rounded-md">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              WhatsApp
            </a>

            {/* Pilihan Telegram */}
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wide cursor-pointer"
            >
              <div className="p-1 bg-blue-500 text-white rounded-md">
                <Send className="w-3.5 h-3.5" />
              </div>
              Telegram Bot
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔘 TOMBOL UTAMA CUSTOMER SERVICE */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        
        // KONFIGURASI DRAG
        drag
        dragSnapToOrigin={false} 
        dragElastic={0}
        dragMomentum={false}
        animate={controls}
        onDragEnd={handleDragEnd}
        // 📌 PERUBAHAN: Mengurangi bottom constraints menjadi 20 agar saat ditarik ke bawah tidak mentok menutupi navigasi bawah
        dragConstraints={{
          top: -window.innerHeight + 180,
          bottom: 20,
          left: -window.innerWidth + 100,
          right: 50
        }}

        whileDrag={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing touch-none text-white transition-colors border border-purple-500/20 ${
          isOpen 
            ? "bg-zinc-800 dark:bg-zinc-700" 
            : "bg-gradient-to-r from-[#6C3CE1] to-[#a855f7]"
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <Headphones className="w-5 h-5" />
            <span className="absolute inset-0 rounded-full bg-[#6C3CE1] animate-ping opacity-25 pointer-events-none" />
          </>
        )}
      </motion.button>
    </div>
  );
}
