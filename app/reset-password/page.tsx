"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Lock, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

const supabase = createClient();

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [validSession, setValidSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Saat user klik link reset dari email, Supabase otomatis membuat sesi
    // sementara ("PASSWORD_RECOVERY") dari token di URL. Kita tunggu event ini
    // (atau sesi yang sudah ada) sebelum menampilkan form ganti password.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setDone(true);
      setMessage({ type: "success", text: "Password berhasil diubah! Mengalihkan ke halaman login..." });
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 1800);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={28} />
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4">
        <div className="max-w-md w-full mx-auto bg-card p-8 rounded-3xl border border-border shadow-sm text-center">
          <h2 className="text-xl font-black text-foreground">Link tidak valid / kedaluwarsa</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Silakan minta link reset password baru lewat halaman login.
          </p>
          <a href="/login" className="mt-4 inline-block text-purple-600 font-bold text-sm">
            ← Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-foreground">Buat Password Baru 🔐</h2>
          <p className="text-sm text-muted-foreground mt-2">Masukkan password baru untuk akun Anda.</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                disabled={done}
                className="w-full p-4 pl-12 pr-12 rounded-2xl border border-border shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all text-foreground bg-muted text-sm placeholder:text-muted-foreground disabled:opacity-60"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-4 top-4 text-muted-foreground" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                disabled={done}
                className="w-full p-4 pl-12 rounded-2xl border border-border shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all text-foreground bg-muted text-sm placeholder:text-muted-foreground disabled:opacity-60"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Lock className="absolute left-4 top-4 text-muted-foreground" size={18} />
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
            disabled={loading || done}
            className="w-full bg-purple-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            Simpan Password Baru
          </button>
        </form>
      </div>
    </div>
  );
}
