"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Mail, Lock, LogIn, UserPlus, Loader2, Eye, EyeOff, ArrowLeft, Send } from "lucide-react";

const supabase = createClient();

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fungsi untuk menangani Login (Sign In)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "Login berhasil! Mengalihkan..." });
      
      // Menggunakan reload penuh agar cookie sesi baru langsung terbaca Middleware 🔄
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);
    }
  };

  // Fungsi untuk menangani Pendaftaran Akun Baru (Sign Up)
  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Email dan password harus diisi!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else if (data.user && data.session === null) {
      setMessage({ type: "success", text: "Pendaftaran berhasil! Silakan cek email Anda jika verifikasi aktif." });
    } else {
      setMessage({ type: "success", text: "Akun berhasil dibuat dan langsung masuk!" });
      
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);
    }
    setLoading(false);
  };

  // Fungsi kirim link reset password ke email
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Masukkan email Anda terlebih dahulu." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Kalau email tersebut terdaftar, kami sudah kirim link reset password ke sana. Cek inbox/folder spam ya.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-card p-8 rounded-3xl border border-border shadow-sm">
        {mode === "signin" ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-foreground">Selamat Datang 👋</h2>
              <p className="text-sm text-muted-foreground mt-2">Silakan masuk atau daftar akun untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full p-4 pl-12 rounded-2xl border border-border shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all text-foreground bg-muted text-sm placeholder:text-muted-foreground"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-4 top-4 text-muted-foreground" size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-muted-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setMessage(null);
                    }}
                    className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full p-4 pl-12 pr-12 rounded-2xl border border-border shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all text-foreground bg-muted text-sm placeholder:text-muted-foreground"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-4 top-4 text-muted-foreground" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold ${
                    message.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                  Masuk Ke Akun
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSignUp}
                  className="w-full bg-muted text-foreground py-3.5 rounded-2xl font-semibold hover:bg-muted/70 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <UserPlus size={18} />
                  Daftar Akun Baru
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 cursor-pointer"
            >
              <ArrowLeft size={16} /> Kembali ke Login
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-foreground">Lupa Password 🔑</h2>
              <p className="text-sm text-muted-foreground mt-2">Masukkan email akun Anda, kami kirimkan link untuk membuat password baru.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full p-4 pl-12 rounded-2xl border border-border shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all text-foreground bg-muted text-sm placeholder:text-muted-foreground"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-4 top-4 text-muted-foreground" size={18} />
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold ${
                    message.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Kirim Link Reset
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
