import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/providers/AppShell";
import { ThemeScript } from "@/components/providers/ThemeScript";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "KantinKu - Pemesanan Kantin Sekolah",
  description:
    "Pesan makanan dan minuman kantin sekolah dengan cepat. Pembayaran digital, stok real-time, notifikasi WhatsApp.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
};

/** Viewport mobile-safe: full width, no accidental zoom cutoffs, notch padding */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} font-sans antialiased bg-stone-100 text-stone-900 dark:bg-[#0a0a0b] dark:text-stone-100`}
      >
        <ThemeScript />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
