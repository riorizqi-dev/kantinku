/**
 * Kompres & konversi file gambar → data URL (base64) untuk localStorage.
 * Max output ~700KB agar localStorage tidak penuh.
 */

const MAX_EDGE = 960;
const JPEG_QUALITY = 0.82;
const MAX_OUTPUT_BYTES = 700_000;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File harus berupa gambar"));
      return;
    }
    // Izinkan hingga 12MB sebelum kompres
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Ukuran file maksimal 12 MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      compressDataUrl(raw)
        .then(resolve)
        .catch(() => resolve(raw)); // fallback tanpa kompres
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export function compressDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas tidak tersedia"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let q = JPEG_QUALITY;
      let out = canvas.toDataURL("image/jpeg", q);
      // Turunkan quality jika masih terlalu besar
      while (out.length > MAX_OUTPUT_BYTES && q > 0.45) {
        q -= 0.1;
        out = canvas.toDataURL("image/jpeg", q);
      }
      if (out.length > MAX_OUTPUT_BYTES * 1.4) {
        reject(new Error("Gambar masih terlalu besar setelah kompresi"));
        return;
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = dataUrl;
  });
}
