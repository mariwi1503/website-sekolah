import { cx } from "./ui";

// Logo sementara berbasis teks. Saat logo resmi tersedia, cukup ganti isi komponen ini
// (misalnya dengan <Image src="/logo.png" …/>).
export function Logo({ ukuran = 44, className }: { ukuran?: number; className?: string }) {
  return (
    <span
      className={cx("clay-sm relative grid shrink-0 place-items-center bg-coral text-white", className)}
      style={{ width: ukuran, height: ukuran, borderRadius: ukuran * 0.34 }}
      aria-label="Logo SDN 16 Sumbawa"
    >
      <span className="font-display leading-none font-bold" style={{ fontSize: ukuran * 0.42 }}>
        16
      </span>
      <span
        className="absolute -right-1 -bottom-1 rounded-full bg-mustard ring-2 ring-permukaan"
        style={{ width: ukuran * 0.3, height: ukuran * 0.3 }}
      />
    </span>
  );
}

export function LogoLengkap({ kecil }: { kecil?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Logo ukuran={kecil ? 36 : 44} />
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-bold">SDN 16 Sumbawa</span>
        <span className="block text-xs text-redup">Sistem Informasi Sekolah</span>
      </span>
    </span>
  );
}
