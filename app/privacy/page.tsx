import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 mb-6 text-sm font-semibold">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-black text-foreground mb-1">Kebijakan Privasi</h1>
          <p className="text-xs text-muted-foreground mb-6">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm text-foreground leading-relaxed">
            <p className="text-muted-foreground italic">
              Catatan: teks di bawah ini adalah draf umum, bukan nasihat hukum. Sesuaikan dan konsultasikan dengan ahli hukum sebelum digunakan secara resmi.
            </p>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">1. Data yang Kami Kumpulkan</h2>
              <p>Kami mengumpulkan data yang Anda berikan secara langsung, seperti email, nama, dan nomor WhatsApp saat melakukan pemesanan.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">2. Penggunaan Data</h2>
              <p>Data Anda digunakan semata-mata untuk memproses pesanan, mengirimkan produk, dan memberikan dukungan pelanggan.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">3. Keamanan Data</h2>
              <p>Kami menyimpan data Anda menggunakan penyedia layanan basis data pihak ketiga (Supabase) dengan pengamanan akses berlapis (Row Level Security), sehingga data pesanan Anda hanya bisa diakses oleh Anda sendiri dan admin.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">4. Berbagi Data</h2>
              <p>Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga, kecuali penyedia layanan pembayaran (Pakasir) untuk keperluan pemrosesan transaksi.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">5. Hak Anda</h2>
              <p>Anda berhak meminta penghapusan akun dan data pribadi Anda dengan menghubungi admin.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">6. Kontak</h2>
              <p>Jika ada pertanyaan mengenai kebijakan privasi ini, silakan hubungi admin melalui halaman profil.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}