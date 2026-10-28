import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiSiswa } from "./isi";

export const metadata: Metadata = { title: "Data Siswa" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiSiswa />
    </KlienSaja>
  );
}
