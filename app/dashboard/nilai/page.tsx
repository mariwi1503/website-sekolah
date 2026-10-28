import type { Metadata } from "next";
import { Segera } from "@/components/segera";

export const metadata: Metadata = { title: "Nilai & Leger" };

export default function Halaman() {
  return (
    <Segera
      judul="Nilai & Leger"
      tahap="Tahap 4"
      poin={[
        "Input nilai formatif, sumatif, STS, dan SAS per tujuan pembelajaran",
        "Leger nilai per kelas, bisa diekspor ke Excel",
        "Rapor Kurikulum Merdeka dengan deskripsi capaian otomatis",
        "Kokurikuler dan ekstrakurikuler (Pramuka)",
      ]}
    />
  );
}
