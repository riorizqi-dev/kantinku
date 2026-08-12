"use client";

import Link from "next/link";
import { ArrowLeft, Camera, UserRound } from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useApp } from "@/context/AppContext";
import { PageTransition } from "@/components/motion/Reveal";

function SellerProfileInner() {
  const { state, updateProfile } = useApp();
  const session = state.session!;
  const user = state.users.find((u) => u.id === session.id);
  const stall = state.sellers.find((s) => s.id === session.sellerId);

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full bg-stone-100 dark:bg-[#0a0a0b] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Link
            href="/dashboard/seller"
            className="mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Kembali ke dashboard
          </Link>

          {/* Banner petunjuk sederhana */}
          <div className="mb-5 rounded-2xl border border-[#FFB300]/30 bg-[#FFB300]/10 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFB300] text-[#1c1917]">
                <UserRound className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="text-base font-semibold text-stone-900 dark:text-white">
                  Ubah foto &amp; nama Anda
                </p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-white/55">
                  1) Ketuk area foto untuk pilih gambar · 2) Ketik nama · 3)
                  Tekan tombol <span className="text-[#FFC107]">Simpan</span> di
                  bawah.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-white/[0.07] bg-white dark:bg-[#121214] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2 text-[#FFB300]">
              <Camera className="h-5 w-5" strokeWidth={1.75} />
              <p className="text-sm font-semibold uppercase tracking-[0.1em]">
                Profil penjual
              </p>
            </div>
            <ProfileForm
              title="Data diri Anda"
              subtitle="Nama & foto tampil ke customer di pesanan lapak ini. Boleh pakai foto dari galeri atau kamera HP."
              initialName={session.name}
              initialAvatar={session.avatar || user?.avatar || ""}
              accent="seller"
              onSave={({ name, avatar }) =>
                updateProfile({
                  name,
                  avatar,
                  phone: user?.phone,
                })
              }
              extraFields={
                <div className="space-y-3 rounded-xl border border-stone-200 dark:border-white/[0.06] bg-stone-50 dark:bg-black/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-white/35">
                    Info lapak (bukan foto profil)
                  </p>
                  <p className="text-sm text-stone-700 dark:text-white/80">
                    {stall?.name || "—"}
                    {stall?.booth ? (
                      <span className="text-stone-500 dark:text-white/40">
                        {" "}
                        · Lapak {stall.booth}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs leading-relaxed text-stone-500 dark:text-white/40">
                    Mau ganti nama lapak atau nomor WhatsApp? Buka{" "}
                    <Link
                      href="/dashboard/seller"
                      className="font-semibold text-[#FFC107] underline-offset-2 hover:underline"
                    >
                      Dashboard → tab Pengaturan
                    </Link>
                    .
                  </p>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500 dark:text-white/40">
                      Username login (tidak bisa diubah di sini)
                    </label>
                    <input
                      value={session.username}
                      readOnly
                      className="w-full rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-black/30 px-3 py-2.5 text-sm text-stone-500 dark:text-white/50"
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

export default function SellerProfilePage() {
  return (
    <RequireRole allow={["seller"]}>
      <SellerProfileInner />
    </RequireRole>
  );
}
