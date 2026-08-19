-- Super Admin enhancements: suspend/activate users, platform settings.
-- Idempoten — aman dijalankan ulang.

-- ---------- users: is_active (suspend akun) ----------
alter table public.users
  add column if not exists is_active boolean not null default true;

-- ---------- platform_settings: kolom jsonb baru ----------
alter table public.platform_settings
  add column if not exists menu_categories jsonb not null default '["Makanan","Minuman","Snack"]'::jsonb,
  add column if not exists announcements jsonb not null default '[]'::jsonb,
  add column if not exists operating_hours jsonb not null default '{"enabled":false,"openTime":"06:30","closeTime":"16:00"}'::jsonb,
  add column if not exists enabled_payment_methods jsonb not null default '["online","canteen"]'::jsonb,
  add column if not exists activity_log jsonb not null default '[]'::jsonb;

-- ---------- backfill: jangan suspend akun seed ----------
update public.users
  set is_active = true
  where id in ('superadmin_1', 'admin_1', 'seller_1', 'seller_2', 'seller_3', 'buyer_1');
