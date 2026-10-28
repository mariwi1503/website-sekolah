import type { Metadata } from "next";
import { Gerbang, KlienSaja } from "@/components/gerbang";
import { PortalOrtu } from "./isi";

export const metadata: Metadata = { title: "Portal Orang Tua" };

export default function Halaman() {
  return (
    <Gerbang peran={["ortu"]}>
      <KlienSaja>
        <PortalOrtu />
      </KlienSaja>
    </Gerbang>
  );
}
