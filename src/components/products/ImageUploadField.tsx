"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Loader2 } from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
  error?: string;
};

/**
 * Upload foto produk: pilih file / gallery / kamera (capture).
 * Light + dark mode.
 */
export function ImageUploadField({ value, onChange, error }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setBusy(true);
    setLocalError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Gagal upload gambar");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-white/40">
        Foto produk <span className="text-red-500 dark:text-red-400">*</span>
      </p>

      <div
        className={cn(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed",
          value
            ? "border-stone-200 bg-stone-100 dark:border-white/10 dark:bg-black/40"
            : "border-stone-300 bg-stone-50 dark:border-white/15 dark:bg-white/[0.03]",
          error || localError ? "border-red-500/50" : ""
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Preview produk"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-stone-400 dark:text-white/35">
            <ImagePlus className="h-8 w-8" strokeWidth={1.25} />
            <p className="text-xs">
              Belum ada foto. Upload dari gallery atau kamera.
            </p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-7 w-7 animate-spin text-[#f97316]" />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]"
        >
          <ImagePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Pilih dari gallery
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]"
        >
          <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
          Ambil dari kamera
        </button>
        {value && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange("")}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Hapus
          </button>
        )}
      </div>

      {(error || localError) && (
        <p className="text-xs text-red-500 dark:text-red-400">
          {error || localError}
        </p>
      )}
      <p className="text-[11px] text-stone-400 dark:text-white/30">
        Format: JPG/PNG/WebP. Otomatis dikompres agar ringan.
      </p>
    </div>
  );
}
