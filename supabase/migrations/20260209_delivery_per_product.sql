-- Migrasi: antar-ke-kelas jadi per-produk (Product.canDeliver), bukan per-gerai.
-- Idempoten — aman dijalankan ulang.

-- 1. Seller: tambahkan is_open + delivery_fee (belum ada di schema lama)
alter table public.sellers
  add column if not exists is_open boolean not null default true,
  add column if not exists delivery_fee integer not null default 0;

-- 2. Product: tambahkan can_deliver (default false = tidak bisa diantar)
alter table public.products
  add column if not exists can_deliver boolean not null default false;

-- 3. Lepas kolom global support_delivery bila masih ada
alter table public.sellers drop column if exists support_delivery;

-- 4. Backfill: produk milik gerai yang dulu support_delivery (seller_1 & seller_3)
--    kini diantar per-produk — aktifkan untuk produk utama mereka.
update public.products
set can_deliver = true
where seller_id in ('seller_1', 'seller_3');

-- 5. Backfill ongkir per gerai (nilai lama dari seed)
update public.sellers set delivery_fee = 2000 where id = 'seller_1';
update public.sellers set delivery_fee = 3000 where id = 'seller_3';

-- 6. Kolom pickup_method + delivery_fee di orders (untuk pesanan antar-ke-kelas)
alter table public.orders
  add column if not exists pickup_method text,
  add column if not exists delivery_fee integer not null default 0;
