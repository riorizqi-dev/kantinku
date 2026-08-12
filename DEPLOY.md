# Deploy KantinKu ke Vercel + Supabase + WarungErik QRIS

**Production URL:** https://kantinku-six.vercel.app

---

## Env yang wajib di Vercel

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://kantinku-six.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `WARUNGERIK_API_KEY` | API key WarungErik Pay |
| `WARUNGERIK_BASE_URL` | `https://pg.warungerik.com` |
| `NEXT_PUBLIC_WARUNGERIK_*` | (sama, fallback browser opsional) |

Push ulang dari `.env.local`:

```bash
node scripts/push-vercel-env.mjs
npx vercel --prod
```

---

## Webhook (opsional)

Kalau WarungErik Pay menyediakan callback di dashboard, isi:

- **Callback URL:** `https://kantinku-six.vercel.app/api/bayar/webhook`

Status order juga disinkronkan lewat polling `/api/bayar/check`, jadi webhook tidak wajib.

---

## Tes setelah deploy

1. https://kantinku-six.vercel.app/api/supabase/health → `"ok": true`
2. https://kantinku-six.vercel.app/api/bayar/health → `"ready": true`
3. Checkout → QRIS → modal QR muncul / payment jalan

---

## Akun demo

| Role | User | Pass |
|------|------|------|
| Super Admin | superadmin | super123 |
| Admin | admin | admin123 |
| GERAI RPL | gerai.rpl | rpl123 |
| GERAI BR | gerai.br | br123 |
| GERAI MP | gerai.mp | mp123 |
| GERAI AK | gerai.ak | ak123 |
| GERAI OSIS | gerai.osis | osis123 |
