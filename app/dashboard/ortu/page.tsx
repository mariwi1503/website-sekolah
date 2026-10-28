import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiOrtu } from "./isi";

export const metadata: Metadata = { title: "Orang Tua" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiOrtu />
    </KlienSaja>
  );
}
