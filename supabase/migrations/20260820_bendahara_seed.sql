-- Seed akun bendahara — JALANKAN TERPISAH, SETELAH file
-- 20260820_bendahara_sales_reports.sql berhasil (enum 'bendahara' sudah di-commit).
-- Idempoten: akun hanya dibuat sekali.

insert into public.users (
  id, username, password, name, role, phone, seller_id, avatar, kelas, is_active, created_at
)
select
  'user_bendahara', 'bendahara', 'bendahara123', 'Bendahara Sekolah', 'bendahara',
  '', null, null, null, true, now()
where not exists (
  select 1 from public.users where id = 'user_bendahara'
);