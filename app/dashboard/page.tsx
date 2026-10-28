import type { Metadata } from "next";
import { KlienSaja } from "@/components/gerbang";
import { IsiDashboard } from "./isi";

export const metadata: Metadata = { title: "Dashboard" };

export default function Halaman() {
  return (
    <KlienSaja>
      <IsiDashboard />
    </KlienSaja>
  );
}
