import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiGuru } from "./isi";

export const metadata: Metadata = { title: "Akun Guru" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiGuru />
    </KlienSaja>
  );
}
