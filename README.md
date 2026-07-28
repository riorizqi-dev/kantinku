# KantinKu

Sistem pemesanan kantin sekolah digital — multi-role, stok real-time, komisi platform, pembayaran Midtrans Snap (QRIS / e-wallet / VA), dan notifikasi WhatsApp.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Framer Motion + Lenis
- Lucide React (icon SVG)
- **Bayar.gg** (QRIS / e-wallet payment)
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
# isi BAYAR_API_KEY + BAYAR_BASE_URL di .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Bayar.gg — cara sambung API Key + Base URL

1. Login [https://www.bayar.gg](https://www.bayar.gg)
2. Ambil **API Key** di dashboard (Settings / API)
3. Base URL standar: `https://www.bayar.gg/api`
4. Isi `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BAYAR_API_KEY=isi_api_key_kamu
BAYAR_BASE_URL=https://www.bayar.gg/api
BAYAR_PAYMENT_METHOD=qris
BAYAR_USE_QRIS_CONVERTER=true
BAYAR_WEBHOOK_SECRET=isi_jika_ada
```

5. Di Bayar.gg → **Settings → Webhook**:
   - Callback URL: `https://domain-kamu.com/api/bayar/webhook`
   - (lokal pakai ngrok/cloudflare tunnel supaya webhook bisa masuk)

### Alur pembayaran

1. Checkout → `POST /api/bayar/create` → Bayar.gg `create-payment.php`
2. User di-redirect ke `payment_url` (halaman bayar QRIS Bayar.gg)
3. Setelah bayar → redirect ke `/orders?paid=1`
4. Frontend poll `GET /api/bayar/check?invoice=...` → status `paid` → stok berkurang + masuk dashboard penjual
5. Webhook `POST /api/bayar/webhook` menerima notifikasi (opsional, verifikasi signature)

Metode: `qris`, `qris_user` (BRI), `gopay_qris`, `ovo` (atur via `BAYAR_PAYMENT_METHOD`).

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
   - `BAYAR_API_KEY`
   - `BAYAR_BASE_URL`
   - `BAYAR_PAYMENT_METHOD`
   - `BAYAR_USE_QRIS_CONVERTER`
   - `BAYAR_WEBHOOK_SECRET` (opsional)
   - `NEXT_PUBLIC_APP_URL` = URL Vercel (contoh `https://kantinku.vercel.app`)
5. Deploy
6. Set webhook Bayar.gg ke `https://your-app.vercel.app/api/bayar/webhook`

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
