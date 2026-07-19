import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 mb-6 text-sm font-semibold">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-black text-foreground mb-1">Syarat & Ketentuan</h1>
          <p className="text-xs text-muted-foreground mb-6">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm text-foreground leading-relaxed">
            <p className="text-muted-foreground italic">
              Catatan: teks di bawah ini adalah draf umum, bukan nasihat hukum. Sesuaikan dan konsultasikan dengan ahli hukum sebelum digunakan secara resmi.
            </p>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">1. Ketentuan Umum</h2>
              <p>Dengan menggunakan layanan ini, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">2. Akun Pengguna</h2>
              <p>Anda wajib membuat akun untuk melakukan pembelian. Anda bertanggung jawab penuh atas kerahasiaan email dan password akun Anda.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">3. Produk & Pembayaran</h2>
              <p>Seluruh produk yang dijual adalah produk digital. Pembayaran dilakukan melalui QRIS dan diproses secara otomatis. Produk akan dikirimkan secara otomatis setelah pembayaran terverifikasi.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">4. Kebijakan Refund</h2>
              <p>Karena sifat produk digital, pembelian yang sudah berhasil diproses dan dikirimkan pada umumnya tidak dapat dibatalkan atau di-refund, kecuali terdapat kesalahan dari pihak kami.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">5. Perubahan Ketentuan</h2>
              <p>Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan berlaku sejak dipublikasikan di halaman ini.</p>
            </section>

            <section>
              <h2 className="font-bold text-base mt-4 mb-2">6. Kontak</h2>
              <p>Jika ada pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi admin melalui halaman profil.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}