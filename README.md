# KantinKu

Sistem pemesanan kantin sekolah digital — multi-role, stok real-time, komisi platform, pembayaran Midtrans Snap (QRIS / e-wallet / VA), dan notifikasi WhatsApp.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Framer Motion + Lenis
- Lucide React (icon SVG)
- **WarungErik Pay** (QRIS dinamis / e-wallet payment)
- State: localStorage (siap diganti database nanti)

## Akun bawaan

| Role | Username | Password | Hak utama |
|------|----------|----------|-----------|
| Super Admin | `superadmin` | `super123` | Komisi, kelola akun, monitoring. **Bukan** kelola produk |
| Admin | `admin` | `admin123` | Lihat pesanan, penjual, laporan. **Bukan** kelola produk |
| Penjual | `penjual` | `penjual123` | **Hanya role ini** tambah/edit/hapus produk & stok + status pesanan |
| Pembeli | daftar / guest | — | Pesan, bayar, riwayat sendiri |

## Menjalankan di lokal

```bash
cd kantinku
npm install
cp .env.example .env.local
# isi WARUNGERIK_API_KEY di .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## WarungErik Pay — cara sambung API Key

1. Login [https://pg.warungerik.com](https://pg.warungerik.com)
2. Ambil **API Secret Key** di dashboard → API / Settings
3. Base URL: `https://pg.warungerik.com`
4. Isi `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WARUNGERIK_API_KEY=isi_api_key_kamu
WARUNGERIK_BASE_URL=https://pg.warungerik.com
```

### Alur pembayaran

1. Checkout → `POST /api/bayar/create` → WarungErik `POST /api/checkout`
2. QRIS dinamis muncul di popup (scan langsung, tanpa redirect) — plus `paymentUrl` kalau mau buka halaman hosted
3. Setelah bayar → `/orders?paid=1`
4. Frontend poll `GET /api/bayar/check?invoice=...` → status `paid` → stok berkurang + masuk dashboard penjual
5. Webhook `POST /api/bayar/webhook` (opsional, jika dikonfigurasi dashboard WarungErik)

## Fitur utama

- **Super Admin**: komisi platform (default 7%), kelola penjual, semua pesanan & produk
- **Penjual**: pesanan masuk (badge baru), update status Menunggu → Diproses → Siap → Selesai, pendapatan bersih, WA ke pembeli
- **Pembeli**: menu, keranjang, checkout Midtrans, riwayat
- **Dark mode** (preferensi disimpan)
- **WhatsApp** via `https://wa.me/62...?text=...`

## Deploy ke Vercel (gratis)

1. Push repo ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Framework: Next.js (auto)
4. Tambahkan Environment Variables:
   - `WARUNGERIK_API_KEY`
   - `WARUNGERIK_BASE_URL`
   - `NEXT_PUBLIC_APP_URL` = URL Vercel (contoh `https://kantinku.vercel.app`)
5. Deploy

```bash
# atau CLI
npm i -g vercel
vercel
```

### Catatan data

State disimpan di **localStorage browser**. Cocok untuk MVP single-device / per-browser. Untuk multi-device production, ganti layer `src/lib/storage.ts` + context ke database (Supabase / PlanetScale / Postgres).

## Struktur

```
src/
  app/
    page.tsx                 # Landing + menu
    cart/ checkout/ orders/
    login/ register/
    dashboard/seller/
    dashboard/admin/
    api/bayar/create|check|webhook
  components/
  context/AppContext.tsx
  lib/                       # types, seed, midtrans, whatsapp, storage
```

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # jalankan build
```
