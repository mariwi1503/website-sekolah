import Image from "next/image";
import logoIkon from "@/public/logo-ikon.png";
import logoPenuh from "@/public/logo.png";
import { cx } from "./ui";

// Emblem tanpa tulisan (potongan dari public/logo.png) untuk ukuran kecil seperti sidebar.
export function Logo({ ukuran = 44, className }: { ukuran?: number; className?: string }) {
  return (
    <span
      className={cx("clay-sm grid shrink-0 place-items-center bg-permukaan", className)}
      style={{ width: ukuran, height: ukuran, borderRadius: ukuran * 0.34, padding: ukuran * 0.12 }}
    >
      <Image src={logoIkon} alt="Logo Sekolah Azzahra" sizes={`${ukuran}px`} className="h-full w-full object-contain" />
    </span>
  );
}

// Logo lengkap beserta tulisan nama sekolah, untuk tampilan besar (layar memuat, pengaturan).
export function LogoPenuh({ lebar = 160, className, preload }: { lebar?: number; className?: string; preload?: boolean }) {
  return (
    <Image
      src={logoPenuh}
      alt="Logo Sekolah Azzahra"
      sizes={`${lebar}px`}
      preload={preload}
      className={cx("h-auto shrink-0", className)}
      style={{ width: lebar }}
    />
  );
}

export function LogoLengkap({ kecil }: { kecil?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Logo ukuran={kecil ? 36 : 44} />
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-bold">Sekolah Azzahra</span>
        <span className="block text-xs text-redup">Sistem Informasi Sekolah</span>
      </span>
    </span>
  );
}
