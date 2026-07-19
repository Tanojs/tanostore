"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";
import {
  User,
  Camera,
  Package,
  Download,
  Settings,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  Loader2,
  Sun,
  Moon,
  MessageCircle,
  BookOpen,
  ChevronRight,
  Eye,
  EyeOff,
  Monitor,
} from "lucide-react";

const supabase = createClient();
const WHATSAPP_NUMBER = "6285701961876";
const APP_VERSION = "1.0.0";

interface ProfileData {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface PurchaseRow {
  id: string;
  order_seq: number;
  account_data: string | null;
  created_at: string;
  products: { title: string; delivery_type: string } | null;
}

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  return "User";
}

function roleBadgeClass(role: string) {
  if (role === "admin") return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
  return "bg-muted text-muted-foreground";
}

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/profile");
        return;
      }
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, role, created_at")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as ProfileData);
        setNameInput(profileData.full_name || "");
      }

      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "paid");

      const { data: paidOrders } = await supabase
        .from("orders")
        .select("id, order_seq, total_price, account_data, created_at, products(title, delivery_type)")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      const totalSpent = (paidOrders || []).reduce((acc, o: any) => acc + Number(o.total_price), 0);
      setStats({ totalOrders: count || 0, totalSpent });
      setPurchases(((paidOrders || []) as any).slice(0, 5));

      setLoading(false);
    }
    load();
  }, [router]);

  const handleSaveName = async () => {
    if (!userId) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ full_name: nameInput.trim() || null }).eq("id", userId);
    setSavingName(false);
    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      setProfile((p) => (p ? { ...p, full_name: nameInput.trim() || null } : p));
      setEditingName(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire("Gagal", "File harus berupa gambar.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Gagal", "Ukuran foto maksimal 2MB.", "error");
      return;
    }

    setUploadingAvatar(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploadingAvatar(false);
      Swal.fire("Gagal Upload", uploadError.message, "error");
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", userId);

    setUploadingAvatar(false);
    if (updateError) {
      Swal.fire("Gagal", updateError.message, "error");
    } else {
      setProfile((p) => (p ? { ...p, avatar_url: publicUrlData.publicUrl } : p));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;

    if (newPassword.length < 6) {
      Swal.fire("Gagal", "Password baru minimal 6 karakter.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire("Gagal", "Konfirmasi password baru tidak cocok.", "error");
      return;
    }

    setChangingPassword(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (verifyError) {
      setChangingPassword(false);
      Swal.fire("Gagal", "Password saat ini salah.", "error");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      Swal.fire("Gagal", error.message, "error");
    } else {
      Swal.fire("Berhasil", "Password berhasil diubah.", "success");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOutAllDevices = async () => {
    const result = await Swal.fire({
      title: "Keluar dari semua perangkat?",
      text: "Semua sesi login (termasuk di HP/device lain) akan diakhiri.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar Semua",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    await supabase.auth.signOut({ scope: "global" });
    router.replace("/login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6 text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border-2 border-border mx-auto">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto profil" className="w-full h-full object-cover" />
              ) : (
                <User className="text-muted-foreground" size={32} />
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full border-2 border-card hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Ganti foto profil"
            >
              {uploadingAvatar ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
            </button>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="mt-3">
            {editingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nama kamu"
                  className="text-center font-bold text-foreground bg-muted border border-border rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 cursor-pointer"
                >
                  {savingName ? "..." : "Simpan"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="font-bold text-foreground text-lg cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {profile?.full_name || "Tambahkan nama"}
              </button>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${roleBadgeClass(profile?.role || "user")}`}>
                {roleLabel(profile?.role || "user")}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Gabung {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-purple-600 dark:text-purple-400" size={18} />
            <h2 className="font-bold text-foreground">Riwayat Pesanan</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted rounded-2xl p-4 text-center">
              <div className="text-xl font-black text-foreground">{stats.totalOrders}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Total Transaksi</div>
            </div>
            <div className="bg-muted rounded-2xl p-4 text-center">
              <div className="text-xl font-black text-foreground">Rp {stats.totalSpent.toLocaleString("id-ID")}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Total Belanja</div>
            </div>
          </div>
          <Link
            href="/cek-order"
            className="flex items-center justify-between text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Lihat semua pesanan & status
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="text-purple-600 dark:text-purple-400" size={18} />
            <h2 className="font-bold text-foreground">Download Produk</h2>
          </div>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada produk yang berhasil dibeli.</p>
          ) : (
            <div className="space-y-2">
              {purchases.map((p) => (
                <div key={p.id} className="border border-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPurchase(expandedPurchase === p.id ? null : p.id)}
                    className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.products?.title || "Produk"}</p>
                      <p className="text-[11px] text-muted-foreground">TANO-{p.order_seq}</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-muted-foreground transition-transform ${expandedPurchase === p.id ? "rotate-90" : ""}`}
                    />
                  </button>
                  {expandedPurchase === p.id && (
                    <div className="px-3.5 pb-3.5">
                      <pre className="p-3 bg-muted rounded-xl text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                        {p.account_data || "Data sedang disiapkan..."}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              {stats.totalOrders > purchases.length && (
                <Link href="/cek-order" className="block text-center text-xs font-semibold text-purple-600 dark:text-purple-400 pt-1 hover:underline">
                  Lihat semua ({stats.totalOrders})
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="text-purple-600 dark:text-purple-400" size={18} />
            <h2 className="font-bold text-foreground">Pengaturan Akun</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              {theme === "dark" ? <Moon size={16} /> : theme === "light" ? <Sun size={16} /> : <Monitor size={16} />}
              Tema Tampilan
            </div>
            <div className="flex gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${theme === "light" ? "bg-purple-600 text-white" : "text-muted-foreground"}`}
              >
                Terang
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${theme === "dark" ? "bg-purple-600 text-white" : "text-muted-foreground"}`}
              >
                Gelap
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-purple-600 dark:text-purple-400" size={18} />
            <h2 className="font-bold text-foreground">Keamanan</h2>
          </div>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full flex items-center justify-between text-sm font-semibold text-foreground py-2 cursor-pointer"
            >
              Ubah Password
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3 py-2">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="Password saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-border bg-muted rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                placeholder="Password baru (min. 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-border bg-muted rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Konfirmasi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-border bg-muted rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-3 text-muted-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-bold text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {changingPassword ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          )}

          <button
            onClick={handleSignOutAllDevices}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground py-2 border-t border-border mt-2 pt-4 cursor-pointer"
          >
            Keluar dari Semua Perangkat
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="text-purple-600 dark:text-purple-400" size={18} />
            <h2 className="font-bold text-foreground">Bantuan</h2>
          </div>
          <div className="space-y-1">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-semibold text-foreground py-2.5 cursor-pointer"
            >
              <MessageCircle size={16} className="text-muted-foreground" />
              Hubungi Admin
            </a>
<Link href="/#faq" className="flex items-center gap-3 text-sm font-semibold text-foreground py-2.5 cursor-pointer">
              <HelpCircle size={16} className="text-muted-foreground" />
              FAQ
            </Link>
            <Link href="/#faq" className="flex items-center gap-3 text-sm font-semibold text-foreground py-2.5 cursor-pointer">
              <BookOpen size={16} className="text-muted-foreground" />
              Panduan Pembelian
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="text-purple-600 dark:text-purple-400" size={18} />
            <h2 className="font-bold text-foreground">Tentang</h2>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-muted-foreground">Versi Aplikasi</span>
              <span className="font-semibold text-foreground">{APP_VERSION}</span>
            </div>
            <Link href="/terms" className="flex items-center justify-between text-sm font-semibold text-foreground py-2 cursor-pointer">
              Syarat &amp; Ketentuan
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link href="/privacy" className="flex items-center justify-between text-sm font-semibold text-foreground py-2 cursor-pointer">
              Kebijakan Privasi
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-2xl hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );
}