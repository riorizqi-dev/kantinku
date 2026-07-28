"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Moon,
  Sun,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/profile/Avatar";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useStallColor } from "@/context/StallColorContext";
import { cn } from "@/lib/utils";

const iconStroke = 1.5;

export function Header() {
  const { state, cartCount, logout, getSellerUnreadCount } = useApp();
  const { theme, toggle } = useTheme();
  const { color: stallColor } = useStallColor();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const session = state.session;
  const unread =
    session?.role === "seller" && session.sellerId
      ? getSellerUnreadCount(session.sellerId)
      : 0;

  // Pedagang tidak pakai menu belanja di nav utama
  const isSeller = session?.role === "seller";
  const nav = isSeller
    ? []
    : [
        { href: "/", label: "Menu" },
        { href: "/orders", label: "Pesanan" },
      ];

  const dashHref =
    session?.role === "superadmin"
      ? "/dashboard/super"
      : session?.role === "admin"
        ? "/dashboard/admin"
        : session?.role === "seller"
          ? "/dashboard/seller"
          : session?.role === "buyer"
            ? "/dashboard/customer"
            : null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Beranda: header overlay di atas hero (tanpa blok hitam body di belakang nav)
  const isHome = pathname === "/";

  const navIdle =
    "text-stone-500 hover:bg-stone-900/[0.05] hover:text-stone-900 dark:text-white/55 dark:hover:bg-white/[0.06] dark:hover:text-white/90";
  const navActive = cn(
    "text-white dark:text-white"
  );
  const iconBtn =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-stone-500 transition-colors duration-200 hover:bg-stone-900/[0.05] hover:text-stone-900 dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white/90";
  const menuLink =
    "flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-white/70 dark:hover:bg-white/[0.04] dark:hover:text-white";

  return (
    <header
      className={cn(
        "z-50 px-3 pt-3 sm:px-5 sm:pt-4",
        // Home: fixed overlay — hero foto tembus di belakang nav
        // Halaman lain: sticky biasa (tetap di alur dokumen)
        isHome ? "pointer-events-none fixed inset-x-0 top-0" : "sticky top-0"
      )}
    >
      {/* Floating glass bar — light & dark */}
      <div
        className={cn(
          "pointer-events-auto relative mx-auto flex h-[56px] w-full max-w-[1200px] items-center justify-between gap-3 rounded-2xl px-3 sm:h-[60px] sm:px-4",
          "border border-stone-200/80 bg-white/75 backdrop-blur-2xl backdrop-saturate-150",
          "shadow-[0_8px_32px_-10px_rgba(28,25,23,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)]",
          // Dark: glass lebih transparan agar foto hero terbaca di belakang
          "dark:border-white/[0.1] dark:bg-[rgba(18,18,20,0.55)]",
          "dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
          // Always visible on first paint (no opacity-0 gate / delayed CSS enter)
          "nav-bar-enter"
        )}
      >
        {/* Subtle noise / grain overlay — dark only */}
        <div
          className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-2xl opacity-[0.035] dark:block"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />

        {/* Left: logo */}
        <Link
          href="/"
          className="relative z-[1] shrink-0 cursor-pointer opacity-100 transition-opacity duration-200 hover:opacity-80"
        >
          <Logo color={stallColor.primary} />
        </Link>

        {/* Center: nav */}
        <nav className="absolute left-1/2 top-1/2 z-[1] hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "cursor-pointer rounded-full px-4 py-[7px] text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200",
                isActive(item.href) ? navActive : navIdle
              )}
              style={isActive(item.href) ? { backgroundColor: stallColor.primaryLight, color: stallColor.text } : undefined}
            >
              {item.label}
            </Link>
          ))}
          {dashHref && (
            <Link
              href={dashHref}
              className={cn(
                "relative cursor-pointer rounded-full px-4 py-[7px] text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200",
                pathname.startsWith("/dashboard") ? navActive : navIdle
              )}
              style={pathname.startsWith("/dashboard") ? { backgroundColor: stallColor.primaryLight, color: stallColor.text } : undefined}
            >
              Dashboard
              {unread > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-white"
                  style={{ backgroundColor: stallColor.primary }}
                >
                  {unread}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Right: actions */}
        <div className="relative z-[1] flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={toggle}
            className={iconBtn}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" strokeWidth={iconStroke} />
            ) : (
              <Moon className="h-[18px] w-[18px]" strokeWidth={iconStroke} />
            )}
          </button>

          {!isSeller && (
            <Link
              href="/cart"
              className={cn(iconBtn, "relative")}
              aria-label="Keranjang"
            >
              <ShoppingBag
                className="h-[18px] w-[18px]"
                strokeWidth={iconStroke}
              />
              {cartCount > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none text-white"
                  style={{ backgroundColor: stallColor.primary }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!session) {
                  router.push("/login");
                  return;
                }
                setMenu((v) => !v);
              }}
              className={cn(
                "ml-0.5 flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold tracking-[-0.01em] text-white transition-colors duration-200 active:scale-[0.98]"
              )}
              style={{
                backgroundColor: stallColor.primary,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              {session ? (
                <>
                  <Avatar
                    name={session.name}
                    avatar={session.avatar}
                    size="sm"
                    className="!h-6 !w-6 ring-0"
                  />
                  <span className="hidden sm:inline">
                    {session.name.split(" ")[0]}
                  </span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>

            <AnimatePresence>
              {menu && session && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl dark:border-white/[0.08] dark:bg-[#1a1a1c]/95 dark:shadow-2xl dark:backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 dark:border-white/[0.06]">
                    <Avatar
                      name={session.name}
                      avatar={session.avatar}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900 dark:text-white">
                        {session.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-white/40">
                        @{session.username}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={
                      session.role === "seller"
                        ? "/dashboard/seller/profile"
                        : session.role === "buyer"
                          ? "/dashboard/customer/profile"
                          : dashHref || "/"
                    }
                    onClick={() => setMenu(false)}
                    className={menuLink}
                  >
                    Akun / Profil
                  </Link>
                  {!isSeller && (
                    <Link
                      href="/orders"
                      onClick={() => setMenu(false)}
                      className={menuLink}
                    >
                      <Receipt className="h-4 w-4" strokeWidth={iconStroke} />{" "}
                      Riwayat
                    </Link>
                  )}
                  {dashHref && (
                    <Link
                      href={dashHref}
                      onClick={() => setMenu(false)}
                      className={menuLink}
                    >
                      <LayoutDashboard
                        className="h-4 w-4"
                        strokeWidth={iconStroke}
                      />{" "}
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={iconStroke} />{" "}
                    Keluar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className={cn(iconBtn, "md:hidden")}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={iconStroke} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={iconStroke} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto relative z-40 mx-auto mt-2 w-full max-w-[1200px] overflow-hidden rounded-2xl border border-stone-200 bg-white/95 px-2 py-2 shadow-xl backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[rgba(18,18,20,0.92)] dark:shadow-2xl md:hidden"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block cursor-pointer rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                  isActive(item.href)
                    ? navActive
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-white/70 dark:hover:bg-white/[0.04] dark:hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
            {dashHref && (
              <Link
                href={dashHref}
                onClick={() => setOpen(false)}
                className="block cursor-pointer rounded-xl px-3 py-2.5 text-[14px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-white/70 dark:hover:bg-white/[0.04] dark:hover:text-white"
              >
                Dashboard {unread > 0 ? `(${unread})` : ""}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
