"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { useApp } from "@/context/AppContext";
import { PageTransition } from "@/components/motion/Reveal";

export default function LoginPage() {
  const { login, toast } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const role = login(username, password);
    setLoading(false);
    if (!role) return;

    // Redirect langsung berdasarkan role (tanpa baca localStorage)
    if (role === "superadmin") {
      router.push("/dashboard/super");
      return;
    }
    if (role === "admin") {
      router.push("/dashboard/admin");
      return;
    }
    if (role === "seller") {
      router.push("/dashboard/seller");
      return;
    }
    if (role === "buyer") {
      router.push("/dashboard/customer");
      return;
    }
    router.push("/");
  }

  return (
    <PageTransition>
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f97316] text-white shadow-soft">
              <LogoMark className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
              Masuk ke KantinKu
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-white/45">
              Customer atau Pedagang (multi-lapak)
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            autoComplete="off"
            className="space-y-4 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-[#121a16] sm:p-8"
          >
            {/* honeypot — bantu cegah autofill browser */}
            <input
              type="text"
              name="username_fake"
              autoComplete="username"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute h-0 w-0 opacity-0"
            />
            <input
              type="password"
              name="password_fake"
              autoComplete="current-password"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute h-0 w-0 opacity-0"
            />

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                Username
              </label>
              <input
                name="login_user"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore
                data-form-type="other"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-medium transition focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 dark:border-stone-700 dark:bg-stone-900"
                placeholder="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                Password
              </label>
              <div className="relative">
                <input
                  name="login_pass"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore
                  data-form-type="other"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 pr-12 text-sm font-medium transition focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 dark:border-stone-700 dark:bg-stone-900"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-white"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan" : "Lihat password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-stone-400 dark:text-white/30">
                Klik ikon mata untuk lihat / sembunyikan password
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f97316] py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:bg-[#ea580c] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" /> Masuk
            </button>
          </form>

          <div className="mt-5 space-y-3 text-center text-sm text-stone-500 dark:text-white/45">
            <p>
              Customer belum punya akun?{" "}
              <Link
                href="/register"
                className="font-bold text-[#f97316] hover:underline dark:text-[#fb923c]"
              >
                Daftar
              </Link>
            </p>
            <button
              type="button"
              onClick={() => {
                toast("Anda dapat memesan tanpa akun", "info");
                router.push("/");
              }}
              className="font-semibold text-stone-600 transition hover:text-[#ea580c] dark:text-stone-300"
            >
              Lanjut sebagai tamu
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
