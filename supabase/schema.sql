-- ============================================================
-- KantinKu × Supabase — schema awal
-- Cara pakai:
-- 1. Buka Supabase Dashboard → SQL Editor → New query
-- 2. Paste seluruh file ini → Run
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type user_role as enum ('superadmin', 'admin', 'seller', 'buyer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type product_category as enum ('Makanan', 'Minuman', 'Snack');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum (
    'waiting', 'processing', 'ready', 'completed', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum (
    'unpaid', 'pending', 'paid', 'failed', 'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_method as enum ('online', 'canteen');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type withdrawal_method as enum ('bank', 'dana', 'ovo', 'gopay');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type withdrawal_status as enum ('pending', 'approved', 'rejected', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type withdrawal_fee_type as enum ('percent', 'flat');
exception when duplicate_object then null;
end $$;

-- ---------- sellers (lapak) ----------
create table if not exists public.sellers (
  id text primary key,
  name text not null,
  owner_user_id text,
  phone text not null default '',
  booth text,
  is_open boolean not null default true,
  delivery_fee integer not null default 0,
  is_active boolean not null default true,
  rating numeric(3,1),
  review_count integer not null default 0,
  rating_sum numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- users (akun login app) ----------
-- Catatan: password plain untuk demo migrasi; production sebaiknya auth Supabase + hash
create table if not exists public.users (
  id text primary key,
  username text not null unique,
  password text not null,
  name text not null,
  role user_role not null default 'buyer',
  kelas text,
  phone text,
  seller_id text references public.sellers(id) on delete set null,
  avatar text,
  created_at timestamptz not null default now()
);

create index if not exists users_seller_id_idx on public.users (seller_id);

-- ---------- products + variants ----------
create table if not exists public.products (
  id text primary key,
  seller_id text not null references public.sellers(id) on delete cascade,
  name text not null,
  category product_category not null default 'Makanan',
  description text not null default '',
  image text not null default '',
  is_active boolean not null default true,
  can_deliver boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists products_seller_id_idx on public.products (seller_id);

create table if not exists public.product_variants (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image text,
  is_active boolean not null default true
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

-- ---------- platform settings (single row) ----------
create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  school_name text not null default 'SMK Negeri 17',
  commission_rate numeric(5,2) not null default 7,
  platform_whatsapp text not null default '',
  order_seq integer not null default 0,
  withdrawal_fee_type withdrawal_fee_type not null default 'percent',
  withdrawal_fee_value numeric(5,2) not null default 3,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, school_name, commission_rate)
values (1, 'SMK Negeri 17', 7)
on conflict (id) do nothing;

-- ---------- orders ----------
create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  seller_id text not null references public.sellers(id),
  seller_name text not null,
  seller_avatar text,
  buyer_id text references public.users(id) on delete set null,
  buyer_name text not null,
  buyer_class text not null default '',
  buyer_phone text not null default '',
  buyer_avatar text,
  subtotal integer not null default 0,
  commission_rate numeric(5,2) not null default 0,
  commission_amount integer not null default 0,
  seller_amount integer not null default 0,
  total integer not null default 0,
  notes text,
  status order_status not null default 'waiting',
  payment_status payment_status not null default 'pending',
  payment_method payment_method,
  pickup_method text check (pickup_method is null or pickup_method in ('takeaway', 'dinein', 'delivery')),
  delivery_fee integer not null default 0,
  bayar_invoice_id text,
  bayar_payment_url text,
  paid_at timestamptz,
  stock_restored boolean not null default false,
  seen_by_seller boolean not null default false,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  rating_comment text,
  rated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_seller_id_idx on public.orders (seller_id);
create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  variant_id text not null,
  name text not null,
  product_name text,
  variant_name text,
  price integer not null,
  qty integer not null check (qty > 0),
  image text not null default ''
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------- withdrawal_requests (pencairan saldo penjual) ----------
create table if not exists public.withdrawal_requests (
  id text primary key,
  seller_id text not null references public.sellers(id),
  seller_name text not null,
  amount integer not null check (amount > 0),
  fee integer not null default 0,
  net_amount integer not null default 0,
  method withdrawal_method not null,
  account_number text not null,
  account_name text not null,
  status withdrawal_status not null default 'pending',
  reject_reason text,
  processed_by text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists withdrawal_requests_seller_id_idx on public.withdrawal_requests (seller_id);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests (status);

-- ---------- RLS (sementara longgar untuk demo; perketat nanti) ----------
alter table public.sellers enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.platform_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.withdrawal_requests enable row level security;

-- Policy: izinkan read/write via anon key (DEMO SAJA)
-- Nanti diganti auth + policy per role
do $$ begin
  create policy "demo_all_sellers" on public.sellers for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_users" on public.users for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_products" on public.products for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_variants" on public.product_variants for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_settings" on public.platform_settings for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_orders" on public.orders for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_order_items" on public.order_items for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "demo_all_withdrawals" on public.withdrawal_requests for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- Selesai. Cek Table Editor — harus muncul: sellers, users, products, ...
