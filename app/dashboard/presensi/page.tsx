import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiPresensi } from "./isi";

export const metadata: Metadata = { title: "Absensi Siswa" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiPresensi />
    </KlienSaja>
  );
}
