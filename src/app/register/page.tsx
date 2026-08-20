"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageTransition } from "@/components/motion/Reveal";

export default function RegisterPage() {
  const { register, toast } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kelas: "",
    username: "",
    password: "",
    phone: "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const err = register({
      name: form.name,
      username: form.username,
      password: form.password,
      kelas: form.kelas,
      phone: form.phone,
    });
    setLoading(false);
    if (err) {
      toast(err, "error");
      return;
    }
    toast("Akun berhasil dibuat");
    router.push("/dashboard/customer");
  }

  return (
    <PageTransition>
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">
              Daftar Akun Siswa
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Simpan riwayat pesanan dan notifikasi WhatsApp
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
              autoComplete="new-password"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute h-0 w-0 opacity-0"
            />

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                Nama Lengkap
              </label>
              <input
                name="reg_name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-medium transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 dark:border-stone-700 dark:bg-stone-900"
                placeholder="Nama lengkap"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                Kelas
              </label>
              <input
                name="reg_kelas"
                type="text"
                required
                value={form.kelas}
                onChange={(e) => setField("kelas", e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-medium transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 dark:border-stone-700 dark:bg-stone-900"
                placeholder="X IPA 1"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                Username
              </label>
              <input
                name="reg_user"
                type="text"
                required
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore
                data-form-type="other"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-medium transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 dark:border-stone-700 dark:bg-stone-900"
                placeholder="username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                Password
              </label>
              <div className="relative">
                <input
                  name="reg_pass"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore
                  data-form-type="other"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 pr-12 text-sm font-medium transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 dark:border-stone-700 dark:bg-stone-900"
                  placeholder="Min. 6 karakter"
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

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                WhatsApp (opsional)
              </label>
              <input
                name="reg_phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-medium transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 dark:border-stone-700 dark:bg-stone-900"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#059669] py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:bg-[#047857] hover:scale-[1.01] disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" /> Daftar
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-bold text-[#047857] hover:underline dark:text-[#10b981]"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
