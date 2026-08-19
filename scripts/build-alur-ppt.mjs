/**
 * KantinKu — Presentasi Alur Sistem + ERD + Screenshot
 */
import pptxgen from "pptxgenjs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import {
  FaStore,
  FaUserGraduate,
  FaUserShield,
  FaUserCog,
  FaShoppingCart,
  FaCreditCard,
  FaClipboardList,
  FaWhatsapp,
  FaDatabase,
  FaLaptopCode,
  FaCheckCircle,
  FaArrowRight,
  FaQrcode,
  FaBoxOpen,
  FaChartLine,
  FaKey,
} from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";
import { MdRestaurantMenu, MdPayments } from "react-icons/md";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const shot = (name) => path.join(root, "screenshots", name);

// Brand palette (match KantinKu UI)
const C = {
  dark: "0B1220",
  darker: "070B14",
  card: "111827",
  cardAlt: "0F172A",
  cream: "F8FAFC",
  white: "FFFFFF",
  emerald: "10B981",
  emeraldDark: "059669",
  emeraldSoft: "D1FAE5",
  text: "0F172A",
  muted: "64748B",
  soft: "94A3B8",
  border: "E2E8F0",
  amber: "F59E0B",
  blue: "3B82F6",
  violet: "8B5CF6",
  rose: "F43F5E",
  cyan: "06B6D4",
};

function renderIconSvg(Icon, color = "#10B981", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
}

async function iconPng(Icon, color, size = 256) {
  const svg = renderIconSvg(Icon, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function shadow() {
  return { type: "outer", color: "000000", blur: 10, offset: 3, angle: 135, opacity: 0.12 };
}

function softShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.1 };
}

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "KantinKu";
pres.title = "KantinKu — Alur Sistem, ERD & Screenshot";
pres.subject = "Penjelasan alur aplikasi pemesanan kantin digital";

// â”€â”€ helpers â”€â”€
function addFooter(slide, page, total = 16, dark = false) {
  slide.addText("KantinKu  ·  SMK Negeri 17", {
    x: 0.5,
    y: 5.28,
    w: 6,
    h: 0.28,
    fontSize: 10,
    fontFace: "Calibri",
    color: dark ? "64748B" : C.muted,
    margin: 0,
  });
  slide.addText(`${page} / ${total}`, {
    x: 8.5,
    y: 5.28,
    w: 1,
    h: 0.28,
    fontSize: 10,
    fontFace: "Calibri",
    color: dark ? "64748B" : C.muted,
    align: "right",
    margin: 0,
  });
}

function sectionLabel(slide, text, x, y, dark = false) {
  slide.addText(text.toUpperCase(), {
    x,
    y,
    w: 4,
    h: 0.28,
    fontSize: 11,
    fontFace: "Calibri",
    color: C.emerald,
    bold: true,
    charSpacing: 2,
    margin: 0,
  });
}

async function main() {
  const icons = {
    store: await iconPng(FaStore, "#10B981"),
    student: await iconPng(FaUserGraduate, "#3B82F6"),
    admin: await iconPng(FaUserShield, "#F59E0B"),
    super: await iconPng(FaUserCog, "#8B5CF6"),
    cart: await iconPng(FaShoppingCart, "#10B981"),
    pay: await iconPng(FaCreditCard, "#06B6D4"),
    list: await iconPng(FaClipboardList, "#F59E0B"),
    wa: await iconPng(FaWhatsapp, "#25D366"),
    db: await iconPng(FaDatabase, "#3B82F6"),
    code: await iconPng(FaLaptopCode, "#10B981"),
    check: await iconPng(FaCheckCircle, "#10B981"),
    arrow: await iconPng(FaArrowRight, "#10B981"),
    qr: await iconPng(FaQrcode, "#059669"),
    box: await iconPng(FaBoxOpen, "#F59E0B"),
    chart: await iconPng(FaChartLine, "#8B5CF6"),
    key: await iconPng(FaKey, "#F59E0B"),
    spark: await iconPng(HiOutlineSparkles, "#10B981"),
    menu: await iconPng(MdRestaurantMenu, "#10B981"),
    payments: await iconPng(MdPayments, "#06B6D4"),
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 1 — Cover
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    // accent blob
    s.addShape(pres.shapes.OVAL, {
      x: 7.2,
      y: -1.2,
      w: 4.5,
      h: 4.5,
      fill: { color: C.emeraldDark, transparency: 70 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: -1.5,
      y: 3.2,
      w: 3.5,
      h: 3.5,
      fill: { color: "064E3B", transparency: 50 },
    });

    s.addText("KANTINKU", {
      x: 0.7,
      y: 1.35,
      w: 8,
      h: 0.35,
      fontSize: 13,
      fontFace: "Calibri",
      color: C.emerald,
      bold: true,
      charSpacing: 4,
      margin: 0,
    });
    s.addText("Alur Sistem Pemesanan\nKantin Digital", {
      x: 0.7,
      y: 1.8,
      w: 8.5,
      h: 1.5,
      fontSize: 40,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addText(
      "Penjelasan alur yang mudah dipahami  ·  ERD database  ·  Screenshot aplikasi nyata",
      {
        x: 0.7,
        y: 3.5,
        w: 8,
        h: 0.4,
        fontSize: 15,
        fontFace: "Calibri",
        color: "94A3B8",
        margin: 0,
      }
    );
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.7,
      y: 4.2,
      w: 3.2,
      h: 0.45,
      fill: { color: C.emerald },
      rectRadius: 0.1,
    });
    s.addText("SMK Negeri 17  ·  Multi-lapak", {
      x: 0.7,
      y: 4.2,
      w: 3.2,
      h: 0.45,
      fontSize: 12,
      fontFace: "Calibri",
      color: C.white,
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 2 — Apa itu KantinKu
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Pengenalan", 0.5, 0.3);
    s.addText("Apa itu KantinKu?", {
      x: 0.5,
      y: 0.55,
      w: 9,
      h: 0.55,
      fontSize: 32,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });
    s.addText(
      "Aplikasi web untuk memesan makanan di kantin sekolah secara digital — multi-lapak, stok real-time, bayar QRIS/di tempat, dan dashboard per peran.",
      {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 0.7,
        fontSize: 15,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      }
    );

    const cards = [
      { icon: icons.menu, t: "Pesan online", d: "Lihat menu, pilih varian, masuk keranjang" },
      { icon: icons.payments, t: "Bayar fleksibel", d: "QRIS (WarungErik) atau bayar di kantin" },
      { icon: icons.store, t: "Multi-lapak", d: "Setiap gerai kelola produk & pesanan sendiri" },
      { icon: icons.chart, t: "Komisi platform", d: "Super Admin atur % komisi otomatis" },
    ];
    cards.forEach((c, i) => {
      const x = 0.5 + i * 2.35;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 2.15,
        w: 2.2,
        h: 2.5,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.12,
      });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.7,
        y: 2.4,
        w: 0.7,
        h: 0.7,
        fill: { color: C.emeraldSoft },
        rectRadius: 0.15,
      });
      s.addImage({ data: c.icon, x: x + 0.85, y: 2.55, w: 0.4, h: 0.4 });
      s.addText(c.t, {
        x: x + 0.15,
        y: 3.3,
        w: 1.9,
        h: 0.4,
        fontSize: 14,
        fontFace: "Arial",
        color: C.text,
        bold: true,
        align: "center",
        margin: 0,
      });
      s.addText(c.d, {
        x: x + 0.15,
        y: 3.75,
        w: 1.9,
        h: 0.7,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        align: "center",
        margin: 0,
      });
    });
    addFooter(s, 2);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 3 — Stack
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Teknologi", 0.5, 0.3);
    s.addText("Stack & arsitektur singkat", {
      x: 0.5,
      y: 0.55,
      w: 9,
      h: 0.5,
      fontSize: 30,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    const left = [
      ["Frontend", "Next.js 14 (App Router) + TypeScript + Tailwind"],
      ["Animasi", "Framer Motion + Lenis smooth scroll"],
      ["State", "AppContext + localStorage (MVP) / Supabase"],
      ["Auth role", "superadmin · admin · seller · buyer"],
    ];
    const right = [
      ["Pembayaran", "WarungErik Pay API (QRIS / e-wallet) + bayar di tempat"],
      ["Database", "Supabase Postgres (schema.sql)"],
      ["Notifikasi", "WhatsApp deep-link (wa.me)"],
      ["Deploy", "Vercel + env WarungErik"],
    ];

    left.forEach((row, i) => {
      const y = 1.3 + i * 0.85;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.5,
        y,
        w: 4.4,
        h: 0.75,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5,
        y,
        w: 0.1,
        h: 0.75,
        fill: { color: C.emerald },
      });
      s.addText(row[0], {
        x: 0.8,
        y: y + 0.1,
        w: 3.9,
        h: 0.28,
        fontSize: 13,
        fontFace: "Arial",
        color: C.emeraldDark,
        bold: true,
        margin: 0,
      });
      s.addText(row[1], {
        x: 0.8,
        y: y + 0.38,
        w: 3.9,
        h: 0.28,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      });
    });

    right.forEach((row, i) => {
      const y = 1.3 + i * 0.85;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 5.15,
        y,
        w: 4.4,
        h: 0.75,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.15,
        y,
        w: 0.1,
        h: 0.75,
        fill: { color: C.blue },
      });
      s.addText(row[0], {
        x: 5.45,
        y: y + 0.1,
        w: 3.9,
        h: 0.28,
        fontSize: 13,
        fontFace: "Arial",
        color: C.blue,
        bold: true,
        margin: 0,
      });
      s.addText(row[1], {
        x: 5.45,
        y: y + 0.38,
        w: 3.9,
        h: 0.28,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      });
    });
    addFooter(s, 3);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 4 — 4 Peran
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Peran pengguna", 0.5, 0.28);
    s.addText("Siapa pakai apa? (4 role)", {
      x: 0.5,
      y: 0.52,
      w: 9,
      h: 0.45,
      fontSize: 28,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    const roles = [
      {
        icon: icons.student,
        color: "3B82F6",
        soft: "DBEAFE",
        title: "Customer (buyer)",
        route: "/  ·  /cart  ·  /orders",
        points: "Lihat menu · Keranjang · Checkout · Riwayat & rating",
      },
      {
        icon: icons.store,
        color: "10B981",
        soft: "D1FAE5",
        title: "Penjual (seller)",
        route: "/dashboard/seller",
        points: "CRUD produk & stok · Update status pesanan · Omzet bersih",
      },
      {
        icon: icons.admin,
        color: "F59E0B",
        soft: "FEF3C7",
        title: "Admin",
        route: "/dashboard/admin",
        points: "Monitor pesanan · Lihat penjual · Laporan (bukan kelola menu)",
      },
      {
        icon: icons.super,
        color: "8B5CF6",
        soft: "EDE9FE",
        title: "Super Admin",
        route: "/dashboard/super",
        points: "Komisi platform · Kelola akun · Monitoring global",
      },
    ];

    roles.forEach((r, i) => {
      const x = 0.4 + (i % 2) * 4.8;
      const y = 1.15 + Math.floor(i / 2) * 1.9;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 4.55,
        h: 1.75,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.12,
      });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.2,
        y: y + 0.35,
        w: 0.7,
        h: 0.7,
        fill: { color: r.soft },
        rectRadius: 0.14,
      });
      s.addImage({ data: r.icon, x: x + 0.35, y: y + 0.5, w: 0.4, h: 0.4 });
      s.addText(r.title, {
        x: x + 1.1,
        y: y + 0.25,
        w: 3.2,
        h: 0.35,
        fontSize: 16,
        fontFace: "Arial",
        color: C.text,
        bold: true,
        margin: 0,
      });
      s.addText(r.route, {
        x: x + 1.1,
        y: y + 0.6,
        w: 3.2,
        h: 0.28,
        fontSize: 11,
        fontFace: "Consolas",
        color: r.color,
        margin: 0,
      });
      s.addText(r.points, {
        x: x + 1.1,
        y: y + 1.0,
        w: 3.2,
        h: 0.5,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      });
    });
    addFooter(s, 4);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 5 — Big picture flow
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    sectionLabel(s, "Gambaran besar", 0.5, 0.28, true);
    s.addText("Alur sistem dalam 1 layar", {
      x: 0.5,
      y: 0.52,
      w: 9,
      h: 0.45,
      fontSize: 28,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });

    const steps = [
      { n: "01", t: "Customer\npilih menu", c: C.emerald },
      { n: "02", t: "Isi keranjang\n& checkout", c: C.cyan },
      { n: "03", t: "Bayar QRIS\natau di tempat", c: C.blue },
      { n: "04", t: "Penjual proses\npesanan", c: C.amber },
      { n: "05", t: "Siap ambil\n+ rating", c: C.violet },
    ];
    steps.forEach((st, i) => {
      const x = 0.4 + i * 1.9;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 1.4,
        w: 1.75,
        h: 2.4,
        fill: { color: "111827" },
        rectRadius: 0.12,
      });
      s.addText(st.n, {
        x,
        y: 1.65,
        w: 1.75,
        h: 0.5,
        fontSize: 22,
        fontFace: "Arial",
        color: st.c,
        bold: true,
        align: "center",
        margin: 0,
      });
      s.addText(st.t, {
        x: x + 0.1,
        y: 2.4,
        w: 1.55,
        h: 1.0,
        fontSize: 14,
        fontFace: "Calibri",
        color: C.white,
        align: "center",
        margin: 0,
      });
      if (i < steps.length - 1) {
        s.addText("â†’", {
          x: x + 1.55,
          y: 2.3,
          w: 0.4,
          h: 0.4,
          fontSize: 18,
          color: C.emerald,
          align: "center",
          margin: 0,
        });
      }
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5,
      y: 4.1,
      w: 9,
      h: 0.85,
      fill: { color: "0F172A" },
      rectRadius: 0.1,
    });
    s.addText(
      "Intinya: siswa pesan lewat HP â†’ bayar â†’ lapak masak â†’ ambil di kantin. Admin pantau, Super Admin atur komisi.",
      {
        x: 0.7,
        y: 4.25,
        w: 8.6,
        h: 0.55,
        fontSize: 14,
        fontFace: "Calibri",
        color: "CBD5E1",
        margin: 0,
      }
    );
    addFooter(s, 5, 16, true);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 6 — Alur customer detail (easy)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Alur customer", 0.5, 0.25);
    s.addText("Cara siswa memesan (langkah mudah)", {
      x: 0.5,
      y: 0.48,
      w: 9,
      h: 0.4,
      fontSize: 26,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    const flow = [
      { n: "1", t: "Buka beranda", d: "Lihat hero + daftar menu semua lapak (filter lapak/kategori/cari)" },
      { n: "2", t: "Pilih produk", d: "Masuk detail â†’ pilih varian (harga & stok berbeda) â†’ Tambah keranjang" },
      { n: "3", t: "Keranjang", d: "Satu lapak per checkout. Atur qty, lanjut bayar" },
      { n: "4", t: "Checkout", d: "Isi nama/kelas/WA · pilih Bayar di kantin atau QRIS online" },
      { n: "5", t: "Bayar & pantau", d: "Jika QRIS â†’ scan · status masuk /orders · ambil saat Siap" },
      { n: "6", t: "Selesai", d: "Pesanan completed â†’ boleh kasih rating & komentar ke lapak" },
    ];

    flow.forEach((f, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.45 + col * 3.15;
      const y = 1.1 + row * 1.9;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 3.0,
        h: 1.7,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.12,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.18,
        y: y + 0.22,
        w: 0.42,
        h: 0.42,
        fill: { color: C.emerald },
      });
      s.addText(f.n, {
        x: x + 0.18,
        y: y + 0.22,
        w: 0.42,
        h: 0.42,
        fontSize: 14,
        fontFace: "Arial",
        color: C.white,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      s.addText(f.t, {
        x: x + 0.75,
        y: y + 0.28,
        w: 2.05,
        h: 0.35,
        fontSize: 15,
        fontFace: "Arial",
        color: C.text,
        bold: true,
        margin: 0,
      });
      s.addText(f.d, {
        x: x + 0.2,
        y: y + 0.85,
        w: 2.6,
        h: 0.7,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      });
    });
    addFooter(s, 6);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 7 — Screenshot Home + Menu
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Screenshot · Customer", 0.4, 0.22);
    s.addText("Beranda & daftar menu", {
      x: 0.4,
      y: 0.42,
      w: 5,
      h: 0.38,
      fontSize: 24,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    // left screenshot
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35,
      y: 0.95,
      w: 4.7,
      h: 3.55,
      fill: { color: "0B1220" },
      rectRadius: 0.08,
      shadow: shadow(),
    });
    s.addImage({
      path: shot("01-home.png"),
      x: 0.45,
      y: 1.05,
      w: 4.5,
      h: 2.81,
      sizing: { type: "cover", w: 4.5, h: 2.81 },
    });
    s.addText("Hero + navigasi Menu / Pesanan / Masuk", {
      x: 0.45,
      y: 3.95,
      w: 4.5,
      h: 0.35,
      fontSize: 11,
      fontFace: "Calibri",
      color: "CBD5E1",
      align: "center",
      margin: 0,
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.2,
      y: 0.95,
      w: 4.45,
      h: 3.55,
      fill: { color: "0B1220" },
      rectRadius: 0.08,
      shadow: shadow(),
    });
    s.addImage({
      path: shot("12-menu-products.png"),
      x: 5.3,
      y: 1.05,
      w: 4.25,
      h: 2.81,
      sizing: { type: "cover", w: 4.25, h: 2.81 },
    });
    s.addText("Filter lapak & kategori · kartu produk", {
      x: 5.3,
      y: 3.95,
      w: 4.25,
      h: 0.35,
      fontSize: 11,
      fontFace: "Calibri",
      color: "CBD5E1",
      align: "center",
      margin: 0,
    });
    addFooter(s, 7);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 8 — Product + Login
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Screenshot · Customer", 0.4, 0.22);
    s.addText("Detail produk & halaman masuk", {
      x: 0.4,
      y: 0.42,
      w: 8,
      h: 0.38,
      fontSize: 24,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35,
      y: 0.95,
      w: 5.5,
      h: 3.7,
      fill: { color: "0B1220" },
      rectRadius: 0.08,
      shadow: shadow(),
    });
    s.addImage({
      path: shot("11-product-detail.png"),
      x: 0.45,
      y: 1.05,
      w: 5.3,
      h: 3.3,
      sizing: { type: "cover", w: 5.3, h: 3.3 },
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.05,
      y: 0.95,
      w: 3.55,
      h: 3.7,
      fill: { color: C.white },
      shadow: softShadow(),
      rectRadius: 0.1,
    });
    s.addImage({
      path: shot("02-login.png"),
      x: 6.2,
      y: 1.1,
      w: 3.25,
      h: 2.55,
      sizing: { type: "cover", w: 3.25, h: 2.55 },
    });
    s.addText("Login: customer / penjual / admin", {
      x: 6.2,
      y: 3.8,
      w: 3.25,
      h: 0.55,
      fontSize: 12,
      fontFace: "Calibri",
      color: C.muted,
      align: "center",
      margin: 0,
    });
    addFooter(s, 8);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 9 — Alur pembayaran
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Alur pembayaran", 0.5, 0.25);
    s.addText("Dua cara bayar — pilih saat checkout", {
      x: 0.5,
      y: 0.48,
      w: 9,
      h: 0.4,
      fontSize: 26,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    // Card A
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.45,
      y: 1.1,
      w: 4.5,
      h: 3.7,
      fill: { color: C.white },
      shadow: softShadow(),
      rectRadius: 0.12,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45,
      y: 1.1,
      w: 4.5,
      h: 0.55,
      fill: { color: C.emerald },
    });
    s.addText("A. Bayar di kantin (COD)", {
      x: 0.6,
      y: 1.2,
      w: 4.2,
      h: 0.4,
      fontSize: 15,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addText(
      [
        { text: "Checkout â†’ metode canteen", options: { bullet: true, breakLine: true } },
        { text: "Order dibuat, status waiting", options: { bullet: true, breakLine: true } },
        { text: "paymentStatus: unpaid / pending", options: { bullet: true, breakLine: true } },
        { text: "Bayar tunai/QRIS gerai saat ambil", options: { bullet: true, breakLine: true } },
        { text: "Penjual proses & selesaikan order", options: { bullet: true } },
      ],
      {
        x: 0.7,
        y: 1.9,
        w: 4.0,
        h: 2.5,
        fontSize: 14,
        fontFace: "Calibri",
        color: C.text,
        paraSpaceAfter: 8,
      }
    );

    // Card B
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.15,
      y: 1.1,
      w: 4.5,
      h: 3.7,
      fill: { color: C.white },
      shadow: softShadow(),
      rectRadius: 0.12,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.15,
      y: 1.1,
      w: 4.5,
      h: 0.55,
      fill: { color: C.blue },
    });
    s.addText("B. Online QRIS (WarungErik)", {
      x: 5.3,
      y: 1.2,
      w: 4.2,
      h: 0.4,
      fontSize: 15,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addText(
      [
        { text: "POST /api/bayar/create â†’ invoice", options: { bullet: true, breakLine: true } },
        { text: "User scan QRIS di modal/redirect", options: { bullet: true, breakLine: true } },
        { text: "Poll GET /api/bayar/check", options: { bullet: true, breakLine: true } },
        { text: "Webhook opsional konfirmasi paid", options: { bullet: true, breakLine: true } },
        { text: "Stok berkurang · masuk dashboard penjual", options: { bullet: true } },
      ],
      {
        x: 5.4,
        y: 1.9,
        w: 4.0,
        h: 2.5,
        fontSize: 14,
        fontFace: "Calibri",
        color: C.text,
        paraSpaceAfter: 8,
      }
    );
    addFooter(s, 9);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 10 — Alur penjual
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Alur penjual", 0.5, 0.25);
    s.addText("Dari pesanan masuk sampai selesai", {
      x: 0.5,
      y: 0.48,
      w: 9,
      h: 0.4,
      fontSize: 26,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    const statuses = [
      { t: "Menunggu", d: "Order baru\nbelum diproses", c: "F59E0B" },
      { t: "Diproses", d: "Sedang dimasak\n/ disiapkan", c: "3B82F6" },
      { t: "Siap", d: "Bisa diambil\ncustomer", c: "10B981" },
      { t: "Selesai", d: "Sudah diambil\n(opsional rating)", c: "059669" },
      { t: "Batal", d: "Dibatalkan\nstok dikembalikan", c: "F43F5E" },
    ];
    statuses.forEach((st, i) => {
      const x = 0.4 + i * 1.9;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 1.15,
        w: 1.8,
        h: 1.9,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.65,
        y: 1.35,
        w: 0.5,
        h: 0.5,
        fill: { color: st.c },
      });
      s.addText(String(i + 1), {
        x: x + 0.65,
        y: 1.35,
        w: 0.5,
        h: 0.5,
        fontSize: 14,
        fontFace: "Arial",
        color: C.white,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      s.addText(st.t, {
        x: x + 0.08,
        y: 2.0,
        w: 1.64,
        h: 0.35,
        fontSize: 13,
        fontFace: "Arial",
        color: C.text,
        bold: true,
        align: "center",
        margin: 0,
      });
      s.addText(st.d, {
        x: x + 0.08,
        y: 2.4,
        w: 1.64,
        h: 0.55,
        fontSize: 11,
        fontFace: "Calibri",
        color: C.muted,
        align: "center",
        margin: 0,
      });
      if (i < statuses.length - 1 && i < 3) {
        s.addText("â†’", {
          x: x + 1.65,
          y: 1.9,
          w: 0.3,
          h: 0.35,
          fontSize: 16,
          color: C.emerald,
          margin: 0,
        });
      }
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.45,
      y: 3.3,
      w: 9.1,
      h: 1.5,
      fill: { color: C.white },
      shadow: softShadow(),
      rectRadius: 0.1,
    });
    s.addText("Yang hanya bisa dilakukan penjual", {
      x: 0.7,
      y: 3.45,
      w: 8.5,
      h: 0.3,
      fontSize: 14,
      fontFace: "Arial",
      color: C.emeraldDark,
      bold: true,
      margin: 0,
    });
    s.addText(
      "Tambah / edit / hapus produk & varian  ·  Atur stok  ·  Ubah status pesanan  ·  Lihat omzet kotor & pendapatan bersih (setelah komisi)  ·  Chat WA ke pembeli  ·  Tidak belanja di menu utama (auto-redirect ke dashboard)",
      {
        x: 0.7,
        y: 3.85,
        w: 8.5,
        h: 0.75,
        fontSize: 13,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      }
    );
    addFooter(s, 10);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 11 — Dashboard screenshots
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Screenshot · Dashboard", 0.35, 0.18);
    s.addText("Tiga dashboard role", {
      x: 0.35,
      y: 0.38,
      w: 8,
      h: 0.35,
      fontSize: 24,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    const dash = [
      { file: "07-seller-dashboard.png", label: "Penjual — GERAI RPL" },
      { file: "08-admin-dashboard.png", label: "Admin platform" },
      { file: "09-super-dashboard.png", label: "Super Admin" },
    ];
    dash.forEach((d, i) => {
      const x = 0.3 + i * 3.25;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 0.9,
        w: 3.1,
        h: 3.85,
        fill: { color: "0B1220" },
        rectRadius: 0.08,
        shadow: shadow(),
      });
      s.addImage({
        path: shot(d.file),
        x: x + 0.08,
        y: 1.0,
        w: 2.94,
        h: 3.2,
        sizing: { type: "cover", w: 2.94, h: 3.2 },
      });
      s.addText(d.label, {
        x: x + 0.08,
        y: 4.28,
        w: 2.94,
        h: 0.35,
        fontSize: 11,
        fontFace: "Calibri",
        color: "CBD5E1",
        align: "center",
        margin: 0,
      });
    });
    addFooter(s, 11);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 12 — Admin & Super
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Alur admin", 0.5, 0.28);
    s.addText("Admin vs Super Admin", {
      x: 0.5,
      y: 0.52,
      w: 9,
      h: 0.4,
      fontSize: 28,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.45,
      y: 1.15,
      w: 4.5,
      h: 3.55,
      fill: { color: C.white },
      shadow: softShadow(),
      rectRadius: 0.12,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45,
      y: 1.15,
      w: 4.5,
      h: 0.6,
      fill: { color: "D97706" },
    });
    s.addText("Admin", {
      x: 0.65,
      y: 1.28,
      w: 4.1,
      h: 0.4,
      fontSize: 18,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addText(
      [
        { text: "Lihat semua pesanan platform", options: { bullet: true, breakLine: true } },
        { text: "Pantau daftar penjual / lapak", options: { bullet: true, breakLine: true } },
        { text: "Laporan penjualan ringkas", options: { bullet: true, breakLine: true } },
        { text: "Tidak kelola produk & stok", options: { bullet: true, breakLine: true } },
        { text: "Tidak ubah komisi platform", options: { bullet: true } },
      ],
      {
        x: 0.75,
        y: 2.0,
        w: 3.9,
        h: 2.4,
        fontSize: 14,
        fontFace: "Calibri",
        color: C.text,
        paraSpaceAfter: 10,
      }
    );

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.15,
      y: 1.15,
      w: 4.5,
      h: 3.55,
      fill: { color: C.white },
      shadow: softShadow(),
      rectRadius: 0.12,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.15,
      y: 1.15,
      w: 4.5,
      h: 0.6,
      fill: { color: "7C3AED" },
    });
    s.addText("Super Admin", {
      x: 5.35,
      y: 1.28,
      w: 4.1,
      h: 0.4,
      fontSize: 18,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addText(
      [
        { text: "Semua kemampuan Admin", options: { bullet: true, breakLine: true } },
        { text: "Atur commission_rate (default 7%)", options: { bullet: true, breakLine: true } },
        { text: "Kelola akun admin / penjual", options: { bullet: true, breakLine: true } },
        { text: "Monitoring global platform", options: { bullet: true, breakLine: true } },
        { text: "Bukan role untuk jualan harian", options: { bullet: true } },
      ],
      {
        x: 5.45,
        y: 2.0,
        w: 3.9,
        h: 2.4,
        fontSize: 14,
        fontFace: "Calibri",
        color: C.text,
        paraSpaceAfter: 10,
      }
    );
    addFooter(s, 12);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 13 — ERD full image
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    s.addText("ERD — Entity Relationship Diagram", {
      x: 0.4,
      y: 0.15,
      w: 9,
      h: 0.35,
      fontSize: 18,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addImage({
      path: shot("erd.png"),
      x: 0.25,
      y: 0.5,
      w: 9.5,
      h: 4.75,
      sizing: { type: "contain", w: 9.5, h: 4.75 },
    });
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 14 — ERD penjelasan mudah
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "ERD mudah dipahami", 0.5, 0.25);
    s.addText("Cara baca relasi data", {
      x: 0.5,
      y: 0.48,
      w: 9,
      h: 0.4,
      fontSize: 26,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    const rels = [
      {
        t: "1 Lapak punya banyak Produk",
        d: "sellers â†’ products (seller_id). Tiap gerai hanya lihat & kelola menu miliknya.",
      },
      {
        t: "1 Produk punya banyak Varian",
        d: "products â†’ product_variants. Harga & stok ada di varian (mis. Mie Goreng / Mie Kuah).",
      },
      {
        t: "1 Lapak punya banyak Pesanan",
        d: "sellers â†’ orders (seller_id). Isolasi: penjual A tidak lihat order penjual B.",
      },
      {
        t: "1 Pesanan punya banyak Item",
        d: "orders â†’ order_items. Tiap baris simpan product_id + variant_id + snapshot harga.",
      },
      {
        t: "Customer terhubung ke Order",
        d: "users (buyer) â†’ orders (buyer_id). Boleh null untuk guest (isi nama manual).",
      },
      {
        t: "Akun penjual menempel ke Lapak",
        d: "users.seller_id â†’ sellers.id. Role seller wajib punya sellerId.",
      },
    ];
    rels.forEach((r, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.4 + col * 4.8;
      const y = 1.05 + row * 1.25;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y,
        w: 4.6,
        h: 1.12,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.1,
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.15,
        y: y + 0.32,
        w: 0.45,
        h: 0.45,
        fill: { color: C.emeraldSoft },
      });
      s.addText(String(i + 1), {
        x: x + 0.15,
        y: y + 0.32,
        w: 0.45,
        h: 0.45,
        fontSize: 13,
        fontFace: "Arial",
        color: C.emeraldDark,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      s.addText(r.t, {
        x: x + 0.75,
        y: y + 0.18,
        w: 3.65,
        h: 0.32,
        fontSize: 13,
        fontFace: "Arial",
        color: C.text,
        bold: true,
        margin: 0,
      });
      s.addText(r.d, {
        x: x + 0.75,
        y: y + 0.52,
        w: 3.65,
        h: 0.5,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      });
    });
    addFooter(s, 14);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 15 — Komisi & isolasi
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };
    sectionLabel(s, "Logika bisnis", 0.5, 0.28);
    s.addText("Komisi & isolasi multi-lapak", {
      x: 0.5,
      y: 0.52,
      w: 9,
      h: 0.4,
      fontSize: 26,
      fontFace: "Arial",
      color: C.text,
      bold: true,
      margin: 0,
    });

    // formula card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.45,
      y: 1.15,
      w: 9.1,
      h: 1.5,
      fill: { color: C.dark },
      rectRadius: 0.12,
    });
    s.addText("Rumus saat checkout (disimpan di orders)", {
      x: 0.7,
      y: 1.3,
      w: 8.5,
      h: 0.3,
      fontSize: 13,
      fontFace: "Calibri",
      color: C.emerald,
      margin: 0,
    });
    s.addText(
      "subtotal  â†’  commission_amount = subtotal Ã— rate%  â†’  seller_amount = subtotal âˆ’ commission  â†’  total = subtotal",
      {
        x: 0.7,
        y: 1.75,
        w: 8.5,
        h: 0.55,
        fontSize: 15,
        fontFace: "Consolas",
        color: C.white,
        margin: 0,
      }
    );

    const boxes = [
      { t: "platform_settings", d: "1 baris global: school_name, commission_rate (7%), order_seq, WA platform" },
      { t: "Isolasi query", d: "products.filter(sellerId) · orders.filter(sellerId) — penjual hanya data sendiri" },
      { t: "Keranjang", d: "CartItem wajib 1 sellerId — tidak campur belanja multi-lapak dalam 1 checkout" },
    ];
    boxes.forEach((b, i) => {
      const x = 0.45 + i * 3.15;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 2.95,
        w: 3.0,
        h: 1.75,
        fill: { color: C.white },
        shadow: softShadow(),
        rectRadius: 0.1,
      });
      s.addText(b.t, {
        x: x + 0.2,
        y: 3.15,
        w: 2.6,
        h: 0.4,
        fontSize: 14,
        fontFace: "Arial",
        color: C.emeraldDark,
        bold: true,
        margin: 0,
      });
      s.addText(b.d, {
        x: x + 0.2,
        y: 3.6,
        w: 2.6,
        h: 0.9,
        fontSize: 12,
        fontFace: "Calibri",
        color: C.muted,
        margin: 0,
      });
    });
    addFooter(s, 15);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SLIDE 16 — Ringkasan + closing
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    s.addText("Ringkasan alur (ingat 4 hal)", {
      x: 0.6,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 28,
      fontFace: "Arial",
      color: C.white,
      bold: true,
      margin: 0,
    });

    const sum = [
      { n: "1", t: "Customer pesan â†’ bayar â†’ ambil", d: "Menu · varian · keranjang · checkout · orders" },
      { n: "2", t: "Penjual kelola lapak sendiri", d: "Produk, stok, status Menungguâ†’…â†’Selesai" },
      { n: "3", t: "Admin pantau, Super atur komisi", d: "Bukan jualan harian — governance platform" },
      { n: "4", t: "Data terisolasi per seller_id", d: "ERD: sellers â†’ products/variants â†’ orders/items" },
    ];
    sum.forEach((item, i) => {
      const y = 1.2 + i * 0.85;
      s.addShape(pres.shapes.OVAL, {
        x: 0.7,
        y: y + 0.05,
        w: 0.5,
        h: 0.5,
        fill: { color: C.emerald },
      });
      s.addText(item.n, {
        x: 0.7,
        y: y + 0.05,
        w: 0.5,
        h: 0.5,
        fontSize: 16,
        fontFace: "Arial",
        color: C.white,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      s.addText(item.t, {
        x: 1.45,
        y: y,
        w: 7.5,
        h: 0.32,
        fontSize: 16,
        fontFace: "Arial",
        color: C.white,
        bold: true,
        margin: 0,
      });
      s.addText(item.d, {
        x: 1.45,
        y: y + 0.35,
        w: 7.5,
        h: 0.3,
        fontSize: 13,
        fontFace: "Calibri",
        color: "94A3B8",
        margin: 0,
      });
    });
  }

  const out = path.join(root, "docs", "KantinKu-Alur-Sistem-ERD.pptx");
  await pres.writeFile({ fileName: out });
  console.log("Wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
