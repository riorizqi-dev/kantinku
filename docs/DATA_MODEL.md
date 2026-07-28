# KantinKu — Model Data (Multi-Pedagang + Varian)

State disimpan di `localStorage` key `kantinku_v3` (browser). Siap diganti DB nanti.

## Entities

### User
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | PK |
| username | string | unique login |
| password | string | plain (demo; production hash) |
| name | string | |
| role | `superadmin` \| `admin` \| `seller` \| `buyer` | buyer = customer |
| sellerId? | string | **wajib** jika role=seller → relasi ke Seller |
| phone? | string | WA customer / kontak |
| kelas? | string | untuk student |

### Seller (Pedagang)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | PK pedagang |
| name | string | Nama lapak (mis. Warung Bu Sari) |
| ownerUserId | string | User.seller yang punya lapak |
| phone | string | WA tujuan notifikasi + chat customer |
| booth | string | Nomor/kode lapak |
| isActive | boolean | |

### Product (produk utama)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | PK |
| **sellerId** | string | **FK Seller — isolasi stok/produk** |
| name | string | Nama utama (tampil di kartu menu), mis. **Mie**, **Teh** |
| category, description, image | | Cover / meta produk |
| isActive | boolean | |
| **variants[]** | ProductVariant | Harga & stok per varian |

### ProductVariant
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | PK varian |
| name | string | mis. Mie Goreng Rendang, Es Teh Manis |
| price | number | Harga varian |
| stock | number | Stok varian |
| image? | string | Opsional; fallback ke foto produk |
| isActive? | boolean | default true |

### Order
| Field | Tipe | Keterangan |
|-------|------|------------|
| id, orderNumber | string | |
| **sellerId** | string | **FK Seller — isolasi pesanan** |
| sellerName | string | snapshot |
| buyerId, buyerName, buyerClass, buyerPhone | | customer |
| items[] | OrderItem | **productId + variantId** |
| status | waiting→processing→ready→completed\|cancelled | |
| paymentStatus, paymentMethod | | |

### CartItem / OrderItem
- `productId` + **`variantId`** — line item = varian yang dipilih
- `name` label: `Produk · Varian` (atau hanya produk jika sama)
- `sellerId` wajib di cart — keranjang 1 lapak saja

## Isolasi

```
Seller 1..n
  └── Product (sellerId)
        └── Variant[] (harga & stok)
  └── Order (sellerId)
        └── OrderItem (productId + variantId)

Query penjual:
  products.filter(p => p.sellerId === session.sellerId)
  orders.filter(o => o.sellerId === session.sellerId)
```

## UX ringkas

| Layar | Perilaku |
|-------|----------|
| Kartu menu | Nama produk utama + “Mulai dari Rp …” jika harga beda |
| Detail | Chip/list pilih varian → add to cart = varian |
| Seller | CRUD produk + CRUD varian di dalamnya |

## Role → Route

| Role | Dashboard |
|------|-----------|
| buyer (customer) | `/dashboard/customer` + menu `/` |
| seller (penjual) | `/dashboard/seller` saja (bukan menu belanja) |
| admin | `/dashboard/admin` |
| superadmin | `/dashboard/super` |
