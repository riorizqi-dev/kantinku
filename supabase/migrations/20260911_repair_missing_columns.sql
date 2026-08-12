-- Repair: samakan DB live dengan schema.sql (idempoten — aman dijalankan ulang).
-- Error "Could not find the 'delivery_fee' column of 'orders' in the schema cache"
-- terjadi karena kolom-kolom berikut belum pernah di-add ke project live Supabase.

-- ---------- sellers ----------
alter table public.sellers
  add column if not exists is_open boolean not null default true,
  add column if not exists delivery_fee integer not null default 0;
alter table public.sellers drop column if exists support_delivery;

-- ---------- products ----------
alter table public.products
  add column if not exists can_deliver boolean not null default false;

-- ---------- orders ----------
alter table public.orders
  add column if not exists pickup_method text check (pickup_method is null or pickup_method in ('takeaway', 'dinein', 'delivery')),
  add column if not exists delivery_fee integer not null default 0,
  add column if not exists bayar_invoice_id text,
  add column if not exists bayar_payment_url text,
  add column if not exists paid_at timestamptz,
  add column if not exists stock_restored boolean not null default false,
  add column if not exists seen_by_seller boolean not null default false,
  add column if not exists rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  add column if not exists rating_comment text,
  add column if not exists rated_at timestamptz;

-- ---------- backfill (opsional, cocokkan seed lama) ----------
update public.products set can_deliver = true where seller_id in ('seller_1', 'seller_3');
update public.sellers set delivery_fee = 2000 where id = 'seller_1';
update public.sellers set delivery_fee = 3000 where id = 'seller_3';