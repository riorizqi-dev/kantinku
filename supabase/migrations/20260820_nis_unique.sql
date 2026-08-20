-- NIS (Nomor Induk Siswa) — identitas unik siswa anti-spam akun.
-- Idempoten — aman dijalankan ulang.

-- ---------- kolom NIS ----------
alter table public.users
  add column if not exists nis text;

-- ---------- format NIS (6–10 digit angka, boleh kosong utk non-siswa) ----------
alter table public.users
  drop constraint if exists users_nis_format_check;
alter table public.users
  add constraint users_nis_format_check
  check (nis is null or nis = '' or nis ~ '^[0-9]{6,10}$');

-- ---------- UNIQUE parsial (hanya baris ber-NIS) ----------
-- Ini penjaga anti-spam utama: NIS yang sama TIDAK bisa dipakai dua kali
-- walau username/email beda. Pelanggaran => error 23505 di backend.
create unique index if not exists users_nis_uidx
  on public.users (nis)
  where nis is not null and nis <> '';

-- ---------- index lookup login cepat ----------
create index if not exists users_nis_idx on public.users (nis);