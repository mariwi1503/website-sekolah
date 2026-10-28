import type { Kalender } from "./db/types";

// Semua tanggal disimpan sebagai string lokal "YYYY-MM-DD" agar tidak bergeser
// karena zona waktu.

export const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function keISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const h = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${h}`;
}

export function dariISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hariIni() {
  return keISO(new Date());
}

export function tambahHari(s: string, n: number) {
  const d = dariISO(s);
  d.setDate(d.getDate() + n);
  return keISO(d);
}

/** "Rabu, 28 Oktober 2026" */
export function formatPanjang(s: string) {
  const d = dariISO(s);
  return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "28 Okt 2026" */
export function formatPendek(s: string) {
  if (!s) return "-";
  const d = dariISO(s);
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function tanggalLibur(s: string, kalender: Kalender[]) {
  return kalender.find((k) => k.jenis === "libur" && k.tglMulai <= s && s <= k.tglSelesai);
}

/** Sekolah masuk Senin–Sabtu, kecuali tanggal libur di kalender akademik. */
export function hariSekolah(s: string, kalender: Kalender[]) {
  return dariISO(s).getDay() !== 0 && !tanggalLibur(s, kalender);
}

export function umur(tglLahir: string, pada = hariIni()) {
  const a = dariISO(tglLahir);
  const b = dariISO(pada);
  let u = b.getFullYear() - a.getFullYear();
  if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) u--;
  return u;
}
