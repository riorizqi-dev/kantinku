"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useApp } from "@/context/AppContext";
import { PageTransition } from "@/components/motion/Reveal";

function CustomerProfileInner() {
  const { state, updateProfile } = useApp();
  const session = state.session!;
  const user = state.users.find((u) => u.id === session.id);

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full bg-stone-100 px-4 py-8 dark:bg-[#0a0a0b] sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Link
            href="/dashboard/customer"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-800 dark:text-white/45 dark:hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Kembali ke dashboard
          </Link>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-[#121214] dark:shadow-none sm:p-8">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-kantin-600 dark:text-[#fb923c]/90">
              Akun Customer
            </p>
            <ProfileForm
              title="Profil saya"
              subtitle="Nama & foto ini terlihat oleh penjual saat Anda memesan."
              initialName={session.name}
              initialAvatar={session.avatar || user?.avatar || ""}
              accent="customer"
              onSave={({ name, avatar }) =>
                updateProfile({
                  name,
                  avatar,
                  phone: user?.phone,
                  kelas: user?.kelas,
                })
              }
              extraFields={
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-500 dark:text-white/40">
                      Kelas
                    </label>
                    <input
                      defaultValue={user?.kelas || ""}
                      name="kelas_display"
                      readOnly
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-500 dark:border-white/10 dark:bg-black/20 dark:text-white/50"
                    />
                    <p className="mt-1 text-[10px] text-stone-400 dark:text-white/25">
                      Kelas diisi saat daftar. Hubungi admin untuk ubah.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-500 dark:text-white/40">
                      Username
                    </label>
                    <input
                      value={session.username}
                      readOnly
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-500 dark:border-white/10 dark:bg-black/20 dark:text-white/50"
                    />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function CustomerProfilePage() {
  return (
    <RequireRole allow={["buyer"]}>
      <CustomerProfileInner />
    </RequireRole>
  );
}
