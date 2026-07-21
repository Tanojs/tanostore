# Panduan Instalasi

Ikuti urutan ini dari atas ke bawah, jangan ada yang dilewat.

## 1. Buat project Supabase

1. Buka [supabase.com](https://supabase.com) → buat project baru (gratis).
2. Tunggu sampai project selesai dibuat (±2 menit).

## 2. Jalankan database

1. Di project Supabase, buka menu **SQL Editor** (sidebar kiri) → **New query**.
2. Buka file `supabase/schema.sql` dari folder project ini, **copy semua isinya**.
3. Paste ke SQL Editor, klik **Run**.
4. Kalau muncul tulisan "Success", lanjut ke langkah berikutnya.

## 3. Ambil kunci Supabase

Masih di Supabase, buka **Project Settings** (ikon gerigi) → **API**. Kamu butuh 3 nilai ini:

| Nama di Supabase | Dipakai untuk |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia, jangan disebar) |

## 4. Daftar Pakasir (payment gateway)

1. Daftar di [pakasir.com](https://pakasir.com), buat project baru.
2. Catat **nama project** (`PAKASIR_PROJECT`) dan **API Key** (`PAKASIR_API_KEY`) dari dashboard Pakasir.

## 5. Isi environment variables

1. Copy file `.env.example` jadi `.env.local`.
2. Isi semua nilainya pakai hasil dari langkah 3 dan 4.

```bash
cp .env.example .env.local
```

## 6. Jalankan di komputer (opsional, buat coba dulu)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` di browser.

## 7. Deploy ke Vercel

1. Push folder project ini ke GitHub (kalau belum).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repo GitHub-nya.
3. Di bagian **Environment Variables**, masukkan semua isi `.env.local` kamu satu-satu.
4. Klik **Deploy**. Tunggu sampai selesai, nanti dikasih link `namakamu.vercel.app`.

## 8. Jadikan diri sendiri Admin

1. Buka website kamu yang sudah live, daftar akun lewat halaman **Login/Daftar**.
2. Balik ke Supabase **SQL Editor**, jalankan (ganti email-nya sesuai yang barusan didaftarkan):

```sql
update public.profiles set role = 'admin' where email = 'emailkamu@gmail.com';
```

3. Refresh halaman website, login ulang — menu **Admin** akan muncul.

## 9. Sambungkan Webhook Pakasir

Di dashboard Pakasir, cari pengaturan **Webhook URL**, isi dengan:

```
https://namakamu.vercel.app/api/pakasir-webhook
```

(Ganti `namakamu.vercel.app` dengan domain kamu yang sebenarnya.)

## 10. Isi data toko

Buka `namakamu.vercel.app/admin`:

1. Tab **Kategori** → tambah minimal 1 kategori.
2. Tab **Produk** → tambah produk pertama.
3. Tab **Stok** → kalau produknya tipe "Account", isi stoknya.

Selesai — toko sudah siap menerima pesanan.

---

## Kalau ada error

- **"relation does not exist"** saat run SQL → pastikan copy SELURUH isi `schema.sql`, jangan sebagian.
- **Login berhasil tapi menu Admin tidak muncul** → cek lagi email di langkah 8, harus sama persis dengan email akun yang didaftarkan.
- **Pembayaran QRIS tidak otomatis lunas** → cek Webhook URL di Pakasir (langkah 9) sudah benar dan sudah di-deploy (bukan localhost).
- **Env variable salah/kurang** → cek lagi `.env.local` (lokal) atau Environment Variables di Vercel (production), pastikan semua nilai dari langkah 3 & 4 terisi tanpa spasi/tanda kutip tambahan.
