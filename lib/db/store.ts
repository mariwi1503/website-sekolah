import { useSyncExternalStore } from "react";
import { buatDataAwal } from "./seed";
import type { Koleksi, NamaKoleksi } from "./types";

// Lapisan akses data. Hanya file ini yang tahu bahwa penyimpanannya localStorage,
// jadi saat pindah ke database sungguhan cukup file ini yang diganti.

const PREFIX = "azzahra:";
// Naikkan angka ini bila struktur data dummy berubah; data akan dimuat ulang.
const VERSI_DATA = "1";

const SEMUA_KOLEKSI: NamaKoleksi[] = [
  "sekolah",
  "tahunAjaran",
  "pengguna",
  "guru",
  "siswa",
  "ortu",
  "mapel",
  "rombel",
  "keanggotaanKelas",
  "pengampu",
  "kalender",
  "presensi",
  "jurnal",
  "pengumuman",
];

const cache = new Map<string, unknown>();
const pendengar = new Set<() => void>();
const KOSONG: never[] = [];

function beritahu() {
  pendengar.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

if (typeof window !== "undefined") {
  // Sinkron antar-tab: tab lain mengubah data → buang cache dan render ulang.
  window.addEventListener("storage", (e) => {
    if (e.key === null) {
      cache.clear();
      beritahu();
    } else if (e.key.startsWith(PREFIX)) {
      cache.delete(e.key);
      beritahu();
    }
  });
}

export class GagalSimpanError extends Error {}

function tulisMentah(kunci: string, nilai: unknown) {
  try {
    localStorage.setItem(PREFIX + kunci, JSON.stringify(nilai));
  } catch {
    throw new GagalSimpanError(
      "Penyimpanan browser penuh atau tidak tersedia. Coba Reset Data Demo di menu Pengaturan.",
    );
  }
  cache.set(PREFIX + kunci, nilai);
}

function bacaMentah<T>(kunci: string, bawaan: T): T {
  const k = PREFIX + kunci;
  if (cache.has(k)) return cache.get(k) as T;
  let nilai = bawaan;
  try {
    const teks = localStorage.getItem(k);
    if (teks !== null) nilai = JSON.parse(teks) as T;
  } catch {
    // data rusak atau localStorage diblokir: pakai nilai bawaan
  }
  cache.set(k, nilai);
  return nilai;
}

let sudahDicek = false;

/** Memuat data dummy bila localStorage masih kosong atau versinya usang. */
export function pastikanData() {
  if (sudahDicek || typeof window === "undefined") return;
  sudahDicek = true;
  let versi: string | null = null;
  try {
    versi = localStorage.getItem(PREFIX + "versi");
  } catch {
    // diabaikan: akan di-seed ulang
  }
  if (versi !== VERSI_DATA) isiDataAwal();
  hapusDataLama();
}

// Data dari identitas sekolah sebelumnya (prefix "sdn16:") tidak dipakai lagi.
function hapusDataLama() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sdn16:"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // diabaikan
  }
}

function isiDataAwal() {
  const data = buatDataAwal(new Date());
  for (const nama of SEMUA_KOLEKSI) tulisMentah(nama, data[nama]);
  try {
    localStorage.setItem(PREFIX + "versi", VERSI_DATA);
  } catch {
    // diabaikan
  }
}

/** Menghapus semua perubahan dan mengembalikan data dummy awal. */
export function resetDataDemo() {
  try {
    // Sesi login dipertahankan agar pengguna tidak terlempar keluar.
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX) && k !== PREFIX + "pref:sesi")
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // diabaikan
  }
  for (const k of [...cache.keys()]) if (k !== PREFIX + "pref:sesi") cache.delete(k);
  isiDataAwal();
  beritahu();
}

export function ukuranPenyimpanan(): number {
  let total = 0;
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) total += (localStorage.getItem(k)?.length ?? 0) * 2;
    }
  } catch {
    // diabaikan
  }
  return total;
}

// ---------- operasi koleksi ----------

export function semua<K extends NamaKoleksi>(nama: K): Koleksi[K][] {
  pastikanData();
  return bacaMentah<Koleksi[K][]>(nama, []);
}

export function ambil<K extends NamaKoleksi>(nama: K, id: string | null | undefined) {
  if (!id) return undefined;
  return semua(nama).find((r) => r.id === id);
}

export function idBaru(awalan: string) {
  return `${awalan}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function tambah<K extends NamaKoleksi>(
  nama: K,
  data: Omit<Koleksi[K], "id"> & { id?: string },
): Koleksi[K] {
  const baris = { ...data, id: data.id ?? idBaru(nama.slice(0, 3)) } as Koleksi[K];
  tulisMentah(nama, [...semua(nama), baris]);
  beritahu();
  return baris;
}

export function ubah<K extends NamaKoleksi>(
  nama: K,
  id: string,
  perubahan: Partial<Koleksi[K]>,
) {
  tulisMentah(
    nama,
    semua(nama).map((r) => (r.id === id ? { ...r, ...perubahan, id } : r)),
  );
  beritahu();
}

export function hapus<K extends NamaKoleksi>(nama: K, id: string) {
  tulisMentah(
    nama,
    semua(nama).filter((r) => r.id !== id),
  );
  beritahu();
}

/** Mengganti seluruh isi koleksi sekaligus (untuk operasi massal). */
export function gantiSemua<K extends NamaKoleksi>(nama: K, baris: Koleksi[K][]) {
  tulisMentah(nama, baris);
  beritahu();
}

// ---------- preferensi kecil (sesi, tahun ajaran yang dilihat) ----------

export function bacaPref(kunci: string): string | null {
  return bacaMentah<string | null>("pref:" + kunci, null);
}

export function tulisPref(kunci: string, nilai: string | null) {
  if (nilai === null) {
    try {
      localStorage.removeItem(PREFIX + "pref:" + kunci);
    } catch {
      // diabaikan
    }
    cache.set(PREFIX + "pref:" + kunci, null);
  } else {
    tulisMentah("pref:" + kunci, nilai);
  }
  beritahu();
}

// ---------- hook React ----------

export function useKoleksi<K extends NamaKoleksi>(nama: K): Koleksi[K][] {
  return useSyncExternalStore(
    subscribe,
    () => semua(nama),
    () => KOSONG,
  );
}

export function usePref(kunci: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => bacaPref(kunci),
    () => null,
  );
}

/** true setelah komponen berjalan di browser (localStorage bisa dibaca). */
export function useSiapDiBrowser() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
