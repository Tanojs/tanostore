-- =============================================================================
-- ZENON STORE — SUPABASE SCHEMA
-- =============================================================================
-- Cara pakai:
--   1. Buka project Supabase kamu -> SQL Editor -> New query.
--   2. Copy-paste SELURUH isi file ini, lalu klik "Run".
--   3. Aman dijalankan berkali-kali (idempotent) selama tidak mengubah tipe data.
--
-- Struktur:
--   - profiles       -> data role user (user/admin), otomatis dibuat saat sign up
--   - categories     -> kategori produk (dikelola admin dari dashboard)
--   - products       -> TABEL PRODUK
--   - product_items  -> TABEL STOK (terpisah dari produk, 1 baris = 1 akun/kode)
--   - orders         -> pesanan
--   - fulfill_order() -> fungsi inti "auto order": mengunci baris, cek stok,
--     menandai stok terjual, dan melunaskan order secara ATOMIC (anti race
--     condition & anti diproses dua kali / idempotent).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES (role: user / admin)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Fungsi bantu: apakah user yang sedang login adalah admin?
-- security definer supaya query internalnya tidak kena RLS profiles (hindari rekursi)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Otomatis buat baris profile (role default 'user') tiap ada akun baru daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Sengaja TIDAK ada policy insert/update untuk role biasa: perubahan role
-- (menjadikan admin) hanya boleh lewat SQL Editor Supabase oleh pemilik project.
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());


-- -----------------------------------------------------------------------------
-- 2. CATEGORIES
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories
  for insert with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories
  for delete using (public.is_admin());


-- -----------------------------------------------------------------------------
-- 3. PRODUCTS (tabel produk)
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.categories(id) on delete set null,
  title         text not null,
  description   text,
  price         numeric(14, 2) not null check (price >= 0),
  delivery_type text not null default 'account' check (delivery_type in ('account', 'file')),
  delivery_info text, -- link/tautan, wajib diisi jika delivery_type = 'file'
  image_url     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint delivery_info_required_for_file
    check (delivery_type <> 'file' or delivery_info is not null)
);

create index if not exists idx_products_category on public.products(category_id);

alter table public.products enable row level security;

-- Publik hanya boleh lihat produk yang aktif. Admin boleh lihat semua (termasuk nonaktif).
drop policy if exists "products_select" on public.products;
create policy "products_select" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());


-- -----------------------------------------------------------------------------
-- 4. PRODUCT_ITEMS (TABEL STOK — terpisah dari tabel produk)
--    1 baris = 1 unit stok (misal: 1 akun premium / 1 kode lisensi)
-- -----------------------------------------------------------------------------
create table if not exists public.product_items (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  data       text not null,      -- isi akun/kode rahasia
  is_sold    boolean not null default false,
  order_id   uuid,               -- diisi otomatis saat item ini terjual
  sold_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_items_available
  on public.product_items (product_id)
  where is_sold = false;

alter table public.product_items enable row level security;

-- PENTING: tidak ada policy select untuk role biasa sama sekali.
-- Tabel ini berisi data akun/kode rahasia, hanya admin (dan service_role
-- lewat webhook, yang otomatis bypass RLS) yang boleh membacanya.
drop policy if exists "product_items_admin_select" on public.product_items;
create policy "product_items_admin_select" on public.product_items
  for select using (public.is_admin());

drop policy if exists "product_items_admin_insert" on public.product_items;
create policy "product_items_admin_insert" on public.product_items
  for insert with check (public.is_admin());

drop policy if exists "product_items_admin_update" on public.product_items;
create policy "product_items_admin_update" on public.product_items
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_items_admin_delete" on public.product_items;
create policy "product_items_admin_delete" on public.product_items
  for delete using (public.is_admin());


-- -----------------------------------------------------------------------------
-- 5. ORDERS
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    uuid not null references public.products(id),
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(14, 2) not null,
  total_price   numeric(14, 2) not null,
  customer_name text,
  whatsapp      text not null,
  status        text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'failed')),
  account_data  text,
  payment_method text,
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'product_items_order_id_fkey'
  ) then
    alter table public.product_items
      add constraint product_items_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete set null;
  end if;
end $$;

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

-- User hanya boleh lihat pesanan miliknya sendiri. Admin boleh lihat semua.
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

-- User hanya boleh membuat order untuk dirinya sendiri, dan HARUS berstatus 'pending'
-- (mencegah user membuat order yang langsung berstatus 'paid').
drop policy if exists "orders_insert_own_pending" on public.orders;
create policy "orders_insert_own_pending" on public.orders
  for insert with check (auth.uid() = user_id and status = 'pending');

-- User HANYA boleh membatalkan order miliknya sendiri selama masih 'pending'
-- (dipakai saat gagal membuat QRIS). User TIDAK BISA mengubah status jadi 'paid'
-- sendiri — itu hanya lewat admin (dashboard) atau webhook pembayaran (service_role).
drop policy if exists "orders_owner_cancel_pending" on public.orders;
create policy "orders_owner_cancel_pending" on public.orders
  for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status in ('pending', 'failed'));

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());


-- -----------------------------------------------------------------------------
-- 6. VIEW UNTUK ETALASE PUBLIK (produk + stok, TANPA membocorkan data akun)
-- -----------------------------------------------------------------------------
-- View ini berjalan dengan hak akses pemilik view (bypass RLS product_items),
-- sehingga bisa menghitung jumlah stok yang tersedia tanpa perlu memberi izin
-- SELECT langsung ke tabel product_items untuk user biasa.
-- Produk delivery_type = 'file' dianggap tidak terbatas (stock = null).
create or replace view public.products_with_stock as
select
  p.id,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  p.title,
  p.description,
  p.price,
  p.delivery_type,
  p.image_url,
  p.created_at,
  case
    when p.delivery_type = 'file' then null
    else (
      select count(*)::int
      from public.product_items pi
      where pi.product_id = p.id and pi.is_sold = false
    )
  end as stock
from public.products p
left join public.categories c on c.id = p.category_id
where p.is_active = true;

grant select on public.products_with_stock to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 7. FULFILL_ORDER — INTI SISTEM AUTO ORDER
-- -----------------------------------------------------------------------------
-- Dipanggil HANYA oleh webhook pembayaran (via service_role), SETELAH status
-- pembayaran diverifikasi ulang ke server Pakasir. Fungsi ini:
--   1. Mengunci baris order (FOR UPDATE) supaya tidak diproses dua kali
--      meski webhook terkirim berkali-kali / bersamaan (idempotent).
--   2. Mencocokkan nominal pembayaran dengan tagihan di sistem kita.
--   3. Untuk produk tipe 'account': mengunci & mengambil baris stok yang
--      tersedia dengan FOR UPDATE SKIP LOCKED — sehingga dua order yang
--      diproses bersamaan TIDAK PERNAH mendapat item stok yang sama
--      (anti race condition).
--   4. Menandai stok terjual & melunaskan order dalam SATU transaksi atomic.
create or replace function public.fulfill_order(
  p_order_id uuid,
  p_verified_amount numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order    record;
  v_product  record;
  v_item_ids bigint[];
  v_count    int;
  v_final_data text;
begin
  -- Kunci baris order ini. Kalau ada proses lain sedang mengunci baris yang
  -- sama, kita akan menunggu sampai proses itu selesai lalu baca ulang statusnya.
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order % tidak ditemukan', p_order_id;
  end if;

  -- IDEMPOTENT: kalau order sudah diproses sebelumnya (bukan 'pending' lagi),
  -- hentikan di sini. Ini mencegah stok terpakai dua kali jika webhook Pakasir
  -- terkirim berulang untuk order yang sama.
  if v_order.status <> 'pending' then
    return;
  end if;

  -- Validasi nominal: harus sama persis dengan tagihan yang kita buat.
  if p_verified_amount is not null and p_verified_amount <> v_order.total_price then
    raise exception 'Nominal pembayaran (%) tidak cocok dengan tagihan order % (%)',
      p_verified_amount, p_order_id, v_order.total_price;
  end if;

  select * into v_product from public.products where id = v_order.product_id;
  if not found then
    raise exception 'Produk untuk order % tidak ditemukan', p_order_id;
  end if;

  if v_product.delivery_type = 'file' then
    v_final_data := coalesce(v_product.delivery_info, 'Tautan produk belum tersedia, hubungi admin.');

  else
    -- Kunci & ambil stok yang tersedia sejumlah quantity. SKIP LOCKED membuat
    -- proses lain yang berjalan bersamaan otomatis lewati baris yang sedang
    -- dikunci proses ini, sehingga tidak mungkin dua order mengambil item stok
    -- yang sama.
    select array_agg(id) into v_item_ids
    from (
      select id
      from public.product_items
      where product_id = v_order.product_id and is_sold = false
      order by id
      limit v_order.quantity
      for update skip locked
    ) sub;

    v_count := coalesce(array_length(v_item_ids, 1), 0);

    if v_count < v_order.quantity then
      -- Pembayaran tetap sah & sudah diterima, tapi stok kurang saat diproses.
      -- Order ditandai lunas supaya pembeli tidak dirugikan, dan admin akan
      -- melihat status ini di dashboard untuk mengirim manual.
      update public.orders
      set status = 'paid',
          account_data = 'Stok sedang kosong, admin akan mengirimkan pesanan Anda secara manual secepatnya. Pembayaran Anda sudah kami terima.',
          paid_at = now()
      where id = p_order_id;
      return;
    end if;

    update public.product_items
    set is_sold = true,
        order_id = p_order_id,
        sold_at = now()
    where id = any(v_item_ids);

    select string_agg(data, e'\n' order by id) into v_final_data
    from public.product_items
    where id = any(v_item_ids);
  end if;

  update public.orders
  set status = 'paid',
      account_data = v_final_data,
      paid_at = now()
  where id = p_order_id;
end;
$$;

-- Hanya boleh dipanggil oleh service_role (dipakai di app/api/pakasir-webhook).
-- User biasa/anon TIDAK BOLEH memanggil fungsi ini langsung.
revoke all on function public.fulfill_order(uuid, numeric) from public, anon, authenticated;
grant execute on function public.fulfill_order(uuid, numeric) to service_role;


-- -----------------------------------------------------------------------------
-- 8. STORAGE BUCKET UNTUK FOTO PRODUK
-- -----------------------------------------------------------------------------
-- Bucket publik: siapa saja boleh MELIHAT foto, tapi hanya admin yang boleh
-- upload/ubah/hapus foto (dipakai di dashboard admin -> Tambah/Ubah Produk).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());


-- -----------------------------------------------------------------------------
-- 9. LANGKAH SETELAH MENJALANKAN SCRIPT INI
-- -----------------------------------------------------------------------------
-- 1) Daftar akun pertama lewat halaman /login di web kamu.
-- 2) Jadikan akun itu admin dengan menjalankan (ganti emailnya):
--
--      update public.profiles set role = 'admin' where email = 'admin@email.com';
--
-- 3) Tambahkan beberapa kategori & produk (+foto) lewat dashboard /admin.
-- 4) Set Webhook URL di project Pakasir kamu ke:
--      https://domainkamu.com/api/pakasir-webhook
-- =============================================================================
