-- Bendahara role + sales reports (setor laporan penjualan).
-- Idempoten — aman dijalankan ulang.

-- ---------- role bendahara ----------
alter type public.user_role add value if not exists 'bendahara';

-- ---------- tabel laporan setoran ----------
create table if not exists public.sales_reports (
  id text primary key,
  seller_id text not null references public.sellers(id) on delete cascade,
  seller_name text not null,
  booth text,
  report_date text not null,
  items jsonb not null default '[]'::jsonb,
  total_revenue integer not null default 0 check (total_revenue >= 0),
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'verified')),
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists sales_reports_seller_date_uidx
  on public.sales_reports (seller_id, report_date);

alter table public.sales_reports enable row level security;
create policy "demo_all_sales_reports"
  on public.sales_reports for all
  using (true) with check (true);

-- ---------- akun seed bendahara ----------
-- DIPISAH ke 20260820_bendahara_seed.sql: nilai enum 'bendahara' yang baru
-- ditambahkan di atas tidak boleh langsung dipakai dalam transaksi yang sama
-- (Postgres error 55P04). Jalankan file ini DULU, lalu file seed-nya.