# Panduan Setup — Zenon Store

Ringkasan semua yang diperbaiki + cara menjalankannya dari nol.

## Apa saja yang diperbaiki

1. **Auto order (webhook Pakasir)** — sebelumnya bisa dipalsukan siapa saja
   (kirim POST langsung ke `/api/pakasir-webhook` dengan status `completed`
   dan langsung dapat produk gratis). Sekarang setiap webhook masuk **diverifikasi
   ulang ke server Pakasir** (Transaction Detail API) sebelum diproses, dan nominal
   pembayaran dicocokkan dengan tagihan asli.
2. **Race condition stok** — dua pembeli yang bayar bersamaan bisa dapat item stok
   yang sama / stok kepakai dobel. Sekarang alokasi stok dilakukan lewat fungsi
   database `fulfill_order()` yang **atomic** (pakai row locking `FOR UPDATE SKIP
   LOCKED`) dan **idempotent** (aman kalau webhook Pakasir terkirim berkali-kali
   untuk order yang sama).
3. **Wajib login sebelum beli** — `/checkout`, `/api/checkout`, `/cek-order`, dan
   `/admin` sekarang benar-benar dicek statusnya di `middleware.ts` (server-side),
   bukan cuma disembunyikan di UI.
4. **Role admin/user yang sebenarnya** — sebelumnya admin dicek dari email yang
   di-hardcode di kode (`foursixxy@gmail.com`) dan **halaman `/admin` sama sekali
   tidak terproteksi** (user biasa yang login bisa buka langsung lewat URL).
   Sekarang ada tabel `profiles` dengan kolom `role` (`user`/`admin`), dicek di
   `middleware.ts` dan di halaman admin itu sendiri.
5. **Tabel produk & tabel stok terpisah**, sesuai skema `products` dan
   `product_items`. Tabel `product_items` (berisi data akun/kode rahasia) **tidak
   bisa dibaca sama sekali oleh user biasa** lewat Row Level Security — hanya admin
   dan webhook (service role) yang bisa mengaksesnya. Etalase publik menghitung
   stok lewat view `products_with_stock` yang aman.
6. **Kategori produk** — sebelumnya hardcode 3 pilihan (`app`/`script`/`panel`) di
   kode. Sekarang ada tabel `categories` yang bisa ditambah admin dari dashboard.
7. **Dashboard admin** — ditambah tab **Kategori** dan **Stok** (pantau + tambah),
   serta tab **Produk** kini menampilkan status aktif/nonaktif dan jumlah stok tiap
   produk.
8. **Halaman `cek-order`** — sebelumnya query ke kolom yang tidak ada di database
   sama sekali (pasti error). Diganti jadi halaman "Riwayat Pesanan Saya" yang
   menampilkan pesanan milik user yang sedang login.

## Langkah instalasi

### 1. Jalankan skema database

Buka **Supabase Dashboard → SQL Editor → New query**, lalu copy-paste seluruh isi
file `supabase/schema.sql`, klik **Run**. Aman dijalankan ulang jika perlu.

### 2. Set environment variables

Copy `.env.example` menjadi `.env.local`, lalu isi semua nilainya (lihat komentar
di tiap baris untuk tahu ambil dari mana).

```bash
cp .env.example .env.local
```

### 3. Install & jalankan

```bash
npm install
npm run dev
```

### 4. Buat akun admin pertama

1. Daftar akun lewat halaman `/login` di web kamu.
2. Di Supabase SQL Editor, jalankan (ganti email-nya):

```sql
update public.profiles set role = 'admin' where email = 'emailkamu@gmail.com';
```

3. Login ulang / refresh — menu **Admin** akan muncul di navbar, dan `/admin` bisa
   diakses.

### 5. Setup Pakasir

Di dashboard project Pakasir kamu, set **Webhook URL** ke:

```
https://domainkamu.com/api/pakasir-webhook
```

### 6. Isi data awal

Dari `/admin`:
1. Tab **Kategori** → tambah minimal 1 kategori.
2. Tab **Produk** → tambah produk (pilih kategori, tipe pengiriman Account/File).
3. Tab **Stok** → khusus produk tipe *Account*, isi daftar akun/kode (satu baris
   satu item).

## Catatan penting

- `SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia — jangan pernah commit ke git atau
  expose ke browser. Hanya dipakai di `app/api/pakasir-webhook/route.ts`.
- Tombol "Tandai Lunas" di tab Pesanan admin **tidak mengirim stok otomatis** —
  itu murni untuk pelunasan manual (mis. transfer langsung). Pengiriman otomatis
  hanya terjadi lewat webhook Pakasir + fungsi `fulfill_order()`.
- Kalau stok habis tepat saat pembayaran QRIS masuk, order tetap ditandai **lunas**
  (karena uang sudah diterima) dengan pesan bahwa admin akan mengirim manual — cek
  order dengan `account_data` berisi "Stok sedang kosong" di database/dashboard.
