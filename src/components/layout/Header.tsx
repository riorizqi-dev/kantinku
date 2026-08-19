"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Search,
  ShoppingCart,
  Moon,
  Sun,
  LayoutDashboard,
  LogOut,
  Receipt,
  Menu,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/profile/Avatar";
import { ContactAdmin } from "@/components/layout/ContactAdmin";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const iconStroke = 1.75;
const HEADER_BG = "#FFB300";

export function Header() {
  const { state, cartCount, logout, getSellerUnreadCount } = useApp();
  const { theme, toggle } = useTheme();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [term, setTerm] = useState("");
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

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
    setOpen(false);
  }

  const iconBtn =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/15 active:bg-white/20";
  const menuLink =
    "flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-white/70 dark:hover:bg-white/[0.04] dark:hover:text-white";

  return (
    <header className="sticky top-0 z-50">
      {/* Bar utama — solid oranye marketplace */}
      <div style={{ backgroundColor: HEADER_BG }}>
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <Link
            href="/"
            className="flex shrink-0 cursor-pointer items-center gap-2"
            aria-label="KantinKu — Beranda"
          >
            <img
                src="/logo.png"
                alt="KantinKu"
                className="h-10 w-10 rounded-md object-contain"
              />
            <span className="hidden flex-col justify-center leading-none sm:flex">
              <span className="text-[16px] font-bold tracking-[-0.02em] text-white">
                KantinKu
              </span>
              <span className="mt-[2px] text-[10px] font-medium tracking-[0.04em] text-white/80">
                SMK Negeri 17
              </span>
            </span>
          </Link>

          {/* Search — desktop (sembunyi untuk pedagang) */}
          {!isSeller && (
            <form
              onSubmit={submitSearch}
              className="mx-auto hidden flex-1 items-stretch md:flex md:max-w-xl"
              role="search"
            >
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Cari menu, misal: nasi goreng, es teh…"
                className="h-9 w-full rounded-l-md border-0 px-3 text-[13px] text-stone-800 outline-none placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-12 cursor-pointer items-center justify-center rounded-r-md bg-[#F0A500] text-white transition-colors hover:bg-[#E09500]"
                aria-label="Cari"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={iconStroke} />
              </button>
            </form>
          )}

          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1 md:flex-none">
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
                <ShoppingCart
                  className="h-[18px] w-[18px]"
                  strokeWidth={iconStroke}
                />
                {cartCount > 0 && (
                  <span
                    className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-[#FFB300]"
                    aria-hidden
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
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/15 active:bg-white/20 sm:px-3"
              >
                {session ? (
                  <>
                    <Avatar
                      name={session.name}
                      avatar={session.avatar}
                      size="sm"
                      className="!h-6 !w-6 ring-0"
                    />
                    <span className="hidden max-w-[90px] truncate sm:inline">
                      {session.name.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <span className="hidden sm:inline">Masuk</span>
                )}
                {!session && (
                  <span className="text-white sm:hidden">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[18px] w-[18px]"
                      aria-hidden
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      />
                      <path
                        d="M4 20c1.5-3.2 4.3-5 8-5s6.5 1.8 8 5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {menu && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-xl dark:border-white/[0.08] dark:bg-[#1a1a1c]/95 dark:backdrop-blur-xl"
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
                      <LogOut
                        className="h-4 w-4"
                        strokeWidth={iconStroke}
                      />{" "}
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

        {/* Search — mobile (sembunyi untuk pedagang) */}
        {!isSeller && (
          <form
            onSubmit={submitSearch}
            className="px-3 pb-2 md:hidden"
            role="search"
          >
            <div className="flex h-9 items-center overflow-hidden rounded-md bg-white">
              <Search
                className="ml-3 h-4 w-4 shrink-0 text-stone-400"
                strokeWidth={iconStroke}
              />
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Cari menu…"
                className="h-full w-full border-0 bg-transparent px-2 text-[13px] text-stone-800 outline-none placeholder:text-stone-400"
              />
              <button
                type="submit"
                className="h-full shrink-0 cursor-pointer bg-[#F0A500] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#E09500]"
              >
                Cari
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nav sekunder — putih */}
      <div className="hidden border-b border-stone-200 bg-white md:block dark:border-white/[0.08] dark:bg-[#111113]">
        <nav className="relative mx-auto flex w-full max-w-[1280px] items-center justify-center gap-1 px-5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
isActive(item.href)
                    ? "border-[#FFB300] font-semibold text-[#FFB300]"
                    : "border-transparent text-stone-600 hover:text-[#FFB300] dark:text-white/60 dark:hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
          {dashHref && (
            <Link
              href={dashHref}
              className={cn(
                "-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
pathname.startsWith("/dashboard")
                    ? "border-[#FFB300] font-semibold text-[#FFB300]"
                    : "border-transparent text-stone-600 hover:text-[#FFB300] dark:text-white/60 dark:hover:text-white"
              )}
            >
              Dashboard {unread > 0 ? `(${unread})` : ""}
            </Link>
          )}
          <div className="absolute right-5 top-0 flex h-full items-center">
            <ContactAdmin variant="icon" />
          </div>
        </nav>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="border-b border-stone-200 bg-white px-2 py-2 shadow-lg dark:border-white/[0.08] dark:bg-[#141416] md:hidden"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block cursor-pointer rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
isActive(item.href)
                      ? "bg-amber-50 text-[#FFB300] dark:bg-white/[0.06] dark:text-amber-400"
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
                className="block cursor-pointer rounded-md px-3 py-2.5 text-[14px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-white/70 dark:hover:bg-white/[0.04] dark:hover:text-white"
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
