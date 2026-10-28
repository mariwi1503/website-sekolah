import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiKelas } from "./isi";

export const metadata: Metadata = { title: "Data Kelas" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiKelas />
    </KlienSaja>
  );
}
