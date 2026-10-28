export type Galat<T> = Partial<Record<keyof T, string>>;

export const wajib = (v: string | undefined | null, label: string) => (!v || !v.trim() ? `${label} wajib diisi.` : undefined);

export function digit(v: string, panjang: number, label: string, opsional = false) {
  if (!v.trim()) return opsional ? undefined : `${label} wajib diisi.`;
  if (!/^\d+$/.test(v)) return `${label} hanya boleh berisi angka.`;
  if (v.length !== panjang) return `${label} harus ${panjang} digit (sekarang ${v.length}).`;
}

export function nomorHp(v: string, opsional = false) {
  if (!v.trim()) return opsional ? undefined : "Nomor HP wajib diisi.";
  if (!/^(08|\+628)\d{7,12}$/.test(v.replace(/[\s-]/g, ""))) return "Format nomor HP tidak valid (contoh: 081234567890).";
}

export function email(v: string) {
  if (v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Format email tidak valid.";
}

export const adaGalat = (g: object) => Object.values(g).some(Boolean);
