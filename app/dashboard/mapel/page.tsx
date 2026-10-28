import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiMapel } from "./isi";

export const metadata: Metadata = { title: "Mata Pelajaran" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiMapel />
    </KlienSaja>
  );
}
