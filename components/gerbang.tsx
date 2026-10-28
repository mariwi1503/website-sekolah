"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSiapDiBrowser } from "@/lib/db/store";
import type { Peran } from "@/lib/db/types";
import { berandaUntuk, punya, usePengguna } from "@/lib/sesi";
import { Logo } from "./logo";

export function Memuat() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Logo ukuran={56} className="animate-pulse" />
        <p className="text-sm font-semibold text-redup">Memuat data sekolah…</p>
      </div>
    </div>
  );
}

/**
 * Semua data ada di localStorage, jadi halaman aplikasi baru dirender setelah
 * berjalan di browser. Gerbang ini juga mengarahkan pengguna yang belum masuk
 * atau tidak punya peran yang sesuai.
 */
export function Gerbang({ peran, children }: { peran: Peran[]; children: ReactNode }) {
  const siap = useSiapDiBrowser();
  const pengguna = usePengguna();
  const router = useRouter();
  const boleh = punya(pengguna, ...peran);

  useEffect(() => {
    if (!siap) return;
    if (!pengguna) router.replace("/login");
    else if (!boleh) router.replace(berandaUntuk(pengguna));
  }, [siap, pengguna, boleh, router]);

  // Halaman tetap dirender (tersembunyi) saat prerender agar segmennya tervalidasi
  // oleh Next.js; data localStorage baru tersedia setelah berjalan di browser.
  const tampil = siap && boleh;
  return (
    <>
      {!tampil && <Memuat />}
      <div hidden={!tampil}>{children}</div>
    </>
  );
}

/**
 * Isi halaman yang bergantung pada localStorage dan tanggal hari ini hanya dirender
 * di browser. Segmen halamannya sendiri tetap dirender saat prerender.
 */
export function KlienSaja({ children }: { children: ReactNode }) {
  return useSiapDiBrowser() ? <>{children}</> : null;
}
