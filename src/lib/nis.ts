/**
 * Validasi NIS (Nomor Induk Siswa) — identitas unik siswa.
 * Format default: 6–10 digit angka. Sesuaikan REGEX bila NIS sekolahmu beda
 * panjang (misal NISN 10 digit: /^\d{10}$/).
 */

export const NIS_REGEX = /^\d{6,10}$/;

/** true bila NIS format valid */
export function isValidNis(nis: string): boolean {
  return NIS_REGEX.test(nis.trim());
}

/** Pesan error format yang jelas untuk form, atau null bila valid */
export function nisError(nis: string): string | null {
  const value = nis.trim();
  if (!value) return "NIS wajib diisi";
  if (!/^\d+$/.test(value)) return "NIS harus berupa angka";
  if (!NIS_REGEX.test(value)) return "NIS harus 6–10 digit angka";
  return null;
}