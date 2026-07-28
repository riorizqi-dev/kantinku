# Deploy KantinKu ke Vercel + Supabase + Bayar.gg QRIS

**Production URL:** https://kantinku-six.vercel.app

---

## Env yang wajib di Vercel

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://kantinku-six.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `BAYAR_API_KEY` | API key Bayar.gg |
| `BAYAR_BASE_URL` | `https://www.bayar.gg/api` |
| `BAYAR_PAYMENT_METHOD` | `qris` |
| `BAYAR_USE_QRIS_CONVERTER` | `true` |
| `BAYAR_PAYMENT_URL` | `https://www.bayar.gg/pay` |
| `NEXT_PUBLIC_BAYAR_*` | (sama, fallback browser) |

**JANGAN** set `BAYAR_FORCE_IP` di Vercel.

Push ulang dari `.env.local`:

```bash
node scripts/push-vercel-env.mjs
npx vercel --prod
```

---

## Webhook Bayar.gg

Dashboard Bayar.gg → Settings → Webhook:

- **Callback URL:** `https://kantinku-six.vercel.app/api/bayar/webhook`

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
