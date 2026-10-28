import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiKalender } from "./isi";

export const metadata: Metadata = { title: "Kalender Akademik" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiKalender />
    </KlienSaja>
  );
}
