import { useMemo } from "react";
import { tulisPref, useKoleksi, usePref } from "./db/store";
import type { Pengguna, Peran, TahunAjaran } from "./db/types";

// Login simulasi: id pengguna disimpan di localStorage. Bukan autentikasi sungguhan.

export function masuk(penggunaId: string) {
  tulisPref("sesi", penggunaId);
}

export function keluar() {
  tulisPref("sesi", null);
  tulisPref("ta", null);
}

export function usePengguna(): Pengguna | null {
  const id = usePref("sesi");
  const pengguna = useKoleksi("pengguna");
  return useMemo(() => pengguna.find((p) => p.id === id) ?? null, [pengguna, id]);
}

export function punya(p: Pengguna | null, ...peran: Peran[]) {
  return !!p && peran.some((x) => p.peran.includes(x));
}

/** Halaman beranda sesuai peran: orang tua ke portal mobile, lainnya ke dashboard. */
export function berandaUntuk(p: Pengguna) {
  return p.peran.includes("ortu") && p.peran.length === 1 ? "/ortu" : "/dashboard";
}

export const LABEL_PERAN: Record<Peran, string> = {
  admin: "Operator Sekolah",
  kepsek: "Kepala Sekolah",
  guru: "Guru",
  ortu: "Orang Tua",
  siswa: "Siswa",
};

/**
 * Tahun ajaran yang sedang dilihat. Tahun ajaran berstatus "ditutup" adalah arsip
 * dan bersifat baca-saja di seluruh aplikasi.
 */
export function useTahunAjaran(): {
  aktif: TahunAjaran | undefined;
  dilihat: TahunAjaran | undefined;
  arsip: boolean;
  semua: TahunAjaran[];
} {
  const semua = useKoleksi("tahunAjaran");
  const pilihan = usePref("ta");
  return useMemo(() => {
    const urut = [...semua].sort((a, b) => b.nama.localeCompare(a.nama));
    const aktif = urut.find((t) => t.status === "aktif") ?? urut[0];
    const dilihat = urut.find((t) => t.id === pilihan) ?? aktif;
    return { aktif, dilihat, arsip: dilihat?.status === "ditutup", semua: urut };
  }, [semua, pilihan]);
}

export function pilihTahunAjaran(id: string) {
  tulisPref("ta", id);
}
