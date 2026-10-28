import type { Metadata } from "next";
import { Segera } from "@/components/segera";

export const metadata: Metadata = { title: "Jurnal Mengajar" };

export default function Halaman() {
  return (
    <Segera
      judul="Jurnal Mengajar"
      tahap="Tahap 3"
      poin={[
        "Isi jurnal harian per jam pelajaran (materi, kegiatan, kendala)",
        "Kepala sekolah memeriksa dan memberi catatan",
        "Unggah modul ajar, ATP, prota, dan promes",
        "Rekap jurnal per guru per bulan",
      ]}
    />
  );
}
