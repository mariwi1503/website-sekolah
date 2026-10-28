import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiPengumuman } from "./isi";

export const metadata: Metadata = { title: "Pengumuman" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiPengumuman />
    </KlienSaja>
  );
}
