"use client";

import { FormEvent, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, Save } from "lucide-react";
import { useRef } from "react";
import { fileToDataUrl } from "@/lib/image-upload";
import { Avatar } from "@/components/profile/Avatar";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  initialName: string;
  initialAvatar?: string;
  /** Field opsional tambahan di atas tombol simpan */
  extraFields?: React.ReactNode;
  onSave: (data: {
    name: string;
    avatar: string;
  }) => string | null | Promise<string | null>;
  accent?: "customer" | "seller";
};

/**
 * Form profil bersama: nama + foto (gallery / kamera).
 */
export function ProfileForm({
  title,
  subtitle,
  initialName,
  initialAvatar = "",
  extraFields,
  onSave,
  accent = "customer",
}: Props) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined | null) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const data = await fileToDataUrl(file);
      setAvatar(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal upload foto");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (name.trim().length < 2) {
      setErr("Nama minimal 2 karakter");
      return;
    }
    setBusy(true);
    try {
      const res = await onSave({ name: name.trim(), avatar });
      if (res) setErr(res);
    } finally {
      setBusy(false);
    }
  }

  const ring =
    accent === "seller"
      ? "ring-[#f97316]/40"
      : "ring-stone-200 dark:ring-white/15";

  const softBtn =
    accent === "seller"
      ? "inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
      : "inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-white/45">
            {subtitle}
          </p>
        )}
      </div>

      {/* Avatar preview — klik foto = pilih gallery */}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "group relative shrink-0 rounded-full ring-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]",
            ring,
            accent === "seller" && "ring-[#f97316]/55 hover:ring-[#f97316]"
          )}
          aria-label="Ubah foto profil"
        >
          <Avatar
            name={name || "User"}
            avatar={avatar}
            size="xl"
            className={
              accent === "seller"
                ? "!h-24 !w-24 !text-xl sm:!h-28 sm:!w-28"
                : undefined
            }
          />
          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100",
              accent === "seller" && "opacity-100 bg-black/40 sm:opacity-0 sm:group-hover:opacity-100"
            )}
          >
            <Camera className="h-6 w-6 text-white" strokeWidth={1.75} />
            <span className="mt-1 text-[11px] font-semibold text-white">
              Ganti foto
            </span>
          </span>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-[#f97316]" />
            </div>
          )}
        </button>
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <p className="text-sm font-semibold text-stone-700 dark:text-white/80">
            Foto profil
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className={softBtn}
            >
              <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
              Pilih dari Galeri
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => camRef.current?.click()}
              className={softBtn}
            >
              <Camera className="h-4 w-4" strokeWidth={1.75} />
              Pakai Kamera
            </button>
            {avatar && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setAvatar("")}
                className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                Hapus foto
              </button>
            )}
          </div>
          <p className="text-xs text-stone-400 dark:text-white/35">
            Boleh ketuk foto di kiri. Perubahan tersimpan setelah tekan{" "}
            <strong className="font-semibold text-stone-500 dark:text-white/55">
              Simpan profil
            </strong>
            .
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-stone-600 dark:text-white/70">
          Nama tampilan
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-base font-medium text-stone-900 placeholder:text-stone-400 focus:border-[#f97316]/50 focus:ring-2 focus:ring-[#f97316]/15 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#f97316]/40 dark:focus:ring-[#f97316]/15"
          placeholder="Nama lengkap Anda"
        />
      </div>

      {extraFields}

      {err && <p className="text-sm text-red-400">{err}</p>}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f97316] px-6 py-3.5 text-base font-bold text-[#1c1917] transition hover:bg-[#0ea572] disabled:opacity-60"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)" }}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" strokeWidth={1.75} />
        )}
        Simpan profil
      </button>
    </form>
  );
}
