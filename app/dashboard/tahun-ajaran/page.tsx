import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiTahunAjaran } from "./isi";

export const metadata: Metadata = { title: "Tahun Ajaran" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiTahunAjaran />
    </KlienSaja>
  );
}
