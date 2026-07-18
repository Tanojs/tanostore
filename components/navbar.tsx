"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Menu, X, MessageCircle, Sun, Moon, User, LogOut, LayoutDashboard, UserCircle } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#products", label: "Produk" },
  { href: "#faq", label: "FAQ" },
];

const WHATSAPP_NUMBER = "6285701961876";

const supabase = createClient();

// --- KOMPONEN TOMBOL TEMA INTERNAL ---
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-xl bg-zinc-200/50 dark:bg-white/5 border border-zinc-300/50 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:text-[#6C3CE1] dark:hover:text-purple-400 transition-colors shadow-sm cursor-pointer"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#6C3CE1]" />
      )}
    </button>
  );
}

// --- KOMPONEN UTAMA NAVBAR ---
export function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ambil role user dari tabel profiles (bukan hardcode email)
  const checkAdminRole = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    setIsAdmin(data?.role === "admin");
  };

  // Pantau status login pengguna secara real-time 🔄
  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      checkAdminRole(session?.user?.id);
    };

    getUserSession();

    // Dengarkan perubahan status auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminRole(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fungsi untuk Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Gunakan reload halaman penuh agar cookie dihapus total dari sisi Middleware
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo Tano Pedia */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#6C3CE1] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#6C3CE1]/20 overflow-hidden">
              <img 
                src="/images/logo.png" 
                alt="Logo Tano Pedia" 
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain" 
              />
            </div>
            <span className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">
              Tano<span className="bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] bg-clip-text text-transparent">Pedia</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-[#6C3CE1] dark:hover:text-purple-400 transition-colors font-semibold"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {/* Tombol Dinamis Login / Logout / Dashboard (Desktop) 🖥️ */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-[#6C3CE1] dark:hover:text-purple-400"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-bold border border-zinc-300 dark:border-white/10 px-4 py-2 rounded-xl text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                >
                  <User className="w-4 h-4" />
                  Masuk
                </Link>
              )}
            </div>

            {/* Desktop CTA Order */}
            <div className="hidden md:block">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo, saya mau order`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white px-4 lg:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#6C3CE1]/25 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                Order Sekarang
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu 📱 */}
        {isOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-border/40 bg-background/98">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm sm:text-base text-muted-foreground hover:text-[#6C3CE1] hover:bg-[#6c3ce1]/5 px-3 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Tombol Dinamis Login / Logout (Mobile) */}
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-sm sm:text-base text-purple-600 dark:text-purple-400 px-3 py-2.5 font-semibold"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dasbor Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-[#6C3CE1] px-3 py-2.5 font-semibold"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profil Saya
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 text-sm sm:text-base text-red-500 px-3 py-2.5 font-semibold text-left w-full cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar Akun
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-[#6C3CE1] px-3 py-2.5 font-semibold"
                >
                  <User className="w-4 h-4" />
                  Masuk / Daftar
                </Link>
              )}

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Halo, saya mau order`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6C3CE1] to-[#a855f7] text-white px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold text-center mt-2 shadow-lg shadow-[#6C3CE1]/25"
              >
                <MessageCircle className="w-4 h-4" />
                Order Sekarang
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
