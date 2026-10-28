import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiPengaturan } from "./isi";

export const metadata: Metadata = { title: "Pengaturan" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiPengaturan />
    </KlienSaja>
  );
}
