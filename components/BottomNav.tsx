"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block sm:hidden">
      {/* Container Navigasi */}
      <div className="bg-card/80 backdrop-blur-lg border-t border-border px-8 py-2 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
        
        {/* TOMBOL 1: HOME */}
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            isActive("/") 
              ? "text-[#6C3CE1] dark:text-purple-400 scale-105 font-bold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Home</span>
        </Link>

        {/* TOMBOL 2: HISTORY */}
        <Link 
          href="/cek-order" 
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            isActive("/cek-order") 
              ? "text-[#6C3CE1] dark:text-purple-400 scale-105 font-bold" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">History</span>
        </Link>

      </div>
      
      {/* Spacer untuk HP yang punya notch/poni bawah (seperti iPhone modern) */}
      <div className="bg-card h-[env(safe-area-inset-bottom)] transition-colors duration-300" />
    </div>
  );
}
