import { useMemo } from "react";
import { gantiSemua, semua, useKoleksi } from "./db/store";
import type { KeanggotaanKelas, Pengguna, Pengumuman, Presensi, Rombel, StatusPresensi } from "./db/types";
import { punya, useTahunAjaran } from "./sesi";

// Kueri turunan yang dipakai lintas halaman.

export function useRombelTA(taId: string | undefined) {
  const rombel = useKoleksi("rombel");
  return useMemo(
    () =>
      rombel
        .filter((r) => r.tahunAjaranId === taId)
        .sort((a, b) => a.tingkat - b.tingkat || a.nama.localeCompare(b.nama)),
    [rombel, taId],
  );
}

/** Rombel yang boleh diakses pengguna pada tahun ajaran yang dilihat. */
export function useRombelSaya(p: Pengguna | null) {
  const { dilihat } = useTahunAjaran();
  const rombel = useRombelTA(dilihat?.id);
  const pengampu = useKoleksi("pengampu");
  return useMemo(() => {
    if (punya(p, "admin", "kepsek")) return rombel;
    if (!p?.guruId) return [];
    const diampu = new Set(pengampu.filter((x) => x.guruId === p.guruId).map((x) => x.rombelId));
    return rombel.filter((r) => r.waliKelasGuruId === p.guruId || diampu.has(r.id));
  }, [p, rombel, pengampu]);
}

export function anggotaDari(keanggotaan: KeanggotaanKelas[], rombelId: string) {
  return keanggotaan.filter((k) => k.rombelId === rombelId).sort((a, b) => a.noAbsen - b.noAbsen);
}

export function hitungPresensi(daftar: Pick<Presensi, "status">[]) {
  const jumlah: Record<StatusPresensi, number> = { H: 0, S: 0, I: 0, A: 0 };
  for (const p of daftar) for (const s of Object.values(p.status)) jumlah[s]++;
  const total = jumlah.H + jumlah.S + jumlah.I + jumlah.A;
  return { ...jumlah, total, persenHadir: total ? (jumlah.H / total) * 100 : 0 };
}

export const LABEL_STATUS: Record<StatusPresensi, string> = { H: "Hadir", S: "Sakit", I: "Izin", A: "Alfa" };

export function namaRombel(r: Rombel | undefined) {
  return r ? `Kelas ${r.nama}` : "-";
}

/** Pengumuman yang relevan untuk pengguna (sesuai target dan rombel). */
export function pengumumanUntuk(
  semua: Pengumuman[],
  p: Pengguna | null,
  rombelAnak: string[] = [],
  rombelGuru: string[] = [],
) {
  return semua
    .filter((x) => {
      if (punya(p, "admin", "kepsek")) return true;
      if (x.penulisId === p?.id) return true;
      if (punya(p, "guru")) {
        if (x.target === "ortu") return x.rombelIds.some((r) => rombelGuru.includes(r));
        return x.rombelIds.length === 0 || x.rombelIds.some((r) => rombelGuru.includes(r));
      }
      if (punya(p, "ortu")) {
        if (x.target === "guru") return false;
        return x.rombelIds.length === 0 || x.rombelIds.some((r) => rombelAnak.includes(r));
      }
      return false;
    })
    .sort((a, b) => Number(b.disematkan) - Number(a.disematkan) || b.tanggal.localeCompare(a.tanggal));
}

/** Mengurutkan ulang nomor absen satu rombel berdasarkan abjad nama siswa. */
export function urutkanNoAbsen(rombelId: string) {
  const siswa = new Map(semua("siswa").map((s) => [s.id, s.nama]));
  const semuaKk = semua("keanggotaanKelas");
  const urut = semuaKk
    .filter((k) => k.rombelId === rombelId)
    .sort((a, b) => (siswa.get(a.siswaId) ?? "").localeCompare(siswa.get(b.siswaId) ?? ""));
  const nomor = new Map(urut.map((k, i) => [k.id, i + 1]));
  gantiSemua(
    "keanggotaanKelas",
    semuaKk.map((k) => (nomor.has(k.id) ? { ...k, noAbsen: nomor.get(k.id)! } : k)),
  );
}
