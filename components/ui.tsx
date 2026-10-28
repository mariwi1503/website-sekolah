"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, CircleCheck, Info, Search, TriangleAlert, X, type LucideIcon } from "lucide-react";

export function cx(...k: (string | false | null | undefined)[]) {
  return k.filter(Boolean).join(" ");
}

// ---------- warna per modul ----------

export type Nada = "sage" | "coral" | "mustard" | "langit" | "lavender" | "netral";

const NADA_IKON: Record<Nada, string> = {
  sage: "bg-sage text-white",
  coral: "bg-coral text-white",
  mustard: "bg-mustard text-white",
  langit: "bg-langit text-white",
  lavender: "bg-lavender text-white",
  netral: "bg-krem-tua text-tinta-2",
};

const NADA_LATAR: Record<Nada, string> = {
  sage: "bg-sage-muda/70",
  coral: "bg-coral-muda/70",
  mustard: "bg-mustard-muda/80",
  langit: "bg-langit-muda/80",
  lavender: "bg-lavender-muda/80",
  netral: "bg-permukaan",
};

const NADA_LENCANA: Record<Nada, string> = {
  sage: "bg-sage-muda text-sage-tua",
  coral: "bg-coral-muda text-coral-tua",
  mustard: "bg-mustard-muda text-mustard-tua",
  langit: "bg-langit-muda text-langit-tua",
  lavender: "bg-lavender-muda text-lavender-tua",
  netral: "bg-krem-tua text-tinta-2",
};

// ---------- dasar ----------

export function Kartu({ children, className, nada }: { children: ReactNode; className?: string; nada?: Nada }) {
  return <div className={cx("clay", nada && NADA_LATAR[nada], className)}>{children}</div>;
}

export function IkonBulat({ ikon: Ikon, nada = "sage", ukuran = "md" }: { ikon: LucideIcon; nada?: Nada; ukuran?: "sm" | "md" | "lg" }) {
  const kelas = { sm: "size-9 rounded-xl", md: "size-12 rounded-2xl", lg: "size-14 rounded-[1.1rem]" }[ukuran];
  const ik = { sm: 18, md: 22, lg: 26 }[ukuran];
  return (
    <span className={cx("clay-sm grid shrink-0 place-items-center", kelas, NADA_IKON[nada])}>
      <Ikon size={ik} strokeWidth={2.2} />
    </span>
  );
}

export function Lencana({ children, nada = "netral" }: { children: ReactNode; nada?: Nada }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", NADA_LENCANA[nada])}>{children}</span>
  );
}

type VarianTombol = "utama" | "kedua" | "sage" | "bahaya" | "hantu";

const VARIAN_TOMBOL: Record<VarianTombol, string> = {
  utama: "tombol-clay bg-coral text-white hover:bg-coral-tua",
  sage: "tombol-clay bg-sage text-white hover:bg-sage-tua",
  bahaya: "tombol-clay bg-[#d4574a] text-white hover:bg-[#bb4537]",
  kedua: "clay-sm bg-permukaan text-tinta hover:bg-white",
  hantu: "text-tinta-2 hover:bg-krem-tua",
};

export function Tombol({
  varian = "utama",
  ukuran = "md",
  ikon: Ikon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  varian?: VarianTombol;
  ukuran?: "sm" | "md";
  ikon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        ukuran === "md" ? "h-11 px-5 text-sm" : "h-9 px-3.5 text-[13px]",
        VARIAN_TOMBOL[varian],
        className,
      )}
    >
      {Ikon && <Ikon size={ukuran === "md" ? 18 : 16} strokeWidth={2.4} />}
      {children}
    </button>
  );
}

export function TombolIkon({ ikon: Ikon, label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { ikon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        "grid size-11 place-items-center rounded-full text-tinta-2 transition hover:bg-krem-tua disabled:pointer-events-none disabled:opacity-40 md:size-9",
        className,
      )}
    >
      <Ikon size={17} strokeWidth={2.2} />
    </button>
  );
}

// ---------- form ----------

const KELAS_INPUT =
  "cekung w-full rounded-2xl border border-transparent px-4 py-2.5 text-sm text-tinta placeholder:text-redup/80 outline-none transition focus:border-coral/50 disabled:opacity-60";

export function Isian({
  label,
  galat,
  bantuan,
  wajib,
  children,
  className,
}: {
  label: string;
  galat?: string;
  bantuan?: string;
  wajib?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-tinta-2">
        {label}
        {wajib && <span className="text-coral"> *</span>}
      </label>
      {children(id)}
      {galat ? <p className="text-xs font-semibold text-[#c2463a]">{galat}</p> : bantuan && <p className="text-xs text-redup">{bantuan}</p>}
    </div>
  );
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(KELAS_INPUT, className)} />;
}

export function Pilihan({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...p} className={cx(KELAS_INPUT, "appearance-none pr-10", className)}>
        {children}
      </select>
      <ChevronDown size={16} strokeWidth={2.6} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-redup" />
    </div>
  );
}

export function AreaTeks({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...p} className={cx(KELAS_INPUT, "resize-y", className)} />;
}

export function KotakCari({
  nilai,
  ubah,
  placeholder = "Cari…",
  className,
}: {
  nilai: string;
  ubah: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cx("cekung flex h-11 items-center gap-2 rounded-full px-4", className)}>
      <Search size={17} className="shrink-0 text-redup" />
      <input
        value={nilai}
        onChange={(e) => ubah(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-redup/80"
      />
      {nilai && (
        <button type="button" onClick={() => ubah("")} aria-label="Hapus pencarian" className="text-redup">
          <X size={15} />
        </button>
      )}
    </label>
  );
}

// ---------- modal ----------

export function Modal({
  buka,
  tutup,
  judul,
  deskripsi,
  children,
  kaki,
  lebar = "md",
}: {
  buka: boolean;
  tutup: () => void;
  judul: string;
  deskripsi?: string;
  children: ReactNode;
  kaki?: ReactNode;
  lebar?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!buka) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && tutup();
    window.addEventListener("keydown", onKey);
    const lama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = lama;
    };
  }, [buka, tutup]);

  if (!buka) return null;
  const maks = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[lebar];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={judul}>
      <div className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]" onClick={tutup} />
      <div className={cx("clay anim-muncul relative flex max-h-[92dvh] w-full flex-col rounded-b-none sm:rounded-b-[1.75rem]", maks)}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
          <div>
            <h2 className="text-xl font-bold">{judul}</h2>
            {deskripsi && <p className="mt-1 text-sm text-redup">{deskripsi}</p>}
          </div>
          <TombolIkon ikon={X} label="Tutup" onClick={tutup} className="-mr-2 -mt-1" />
        </div>
        <div className="scroll-tipis overflow-y-auto px-6 py-3">{children}</div>
        {kaki && <div className="flex flex-wrap justify-end gap-3 px-6 pt-3 pb-6">{kaki}</div>}
      </div>
    </div>
  );
}

export function Konfirmasi({
  buka,
  tutup,
  judul,
  pesan,
  labelYa = "Hapus",
  bahaya = true,
  onYa,
}: {
  buka: boolean;
  tutup: () => void;
  judul: string;
  pesan: ReactNode;
  labelYa?: string;
  bahaya?: boolean;
  onYa: () => void;
}) {
  return (
    <Modal
      buka={buka}
      tutup={tutup}
      judul={judul}
      lebar="sm"
      kaki={
        <>
          <Tombol varian="kedua" onClick={tutup}>
            Batal
          </Tombol>
          <Tombol
            varian={bahaya ? "bahaya" : "utama"}
            onClick={() => {
              onYa();
              tutup();
            }}
          >
            {labelYa}
          </Tombol>
        </>
      }
    >
      <div className="text-sm text-tinta-2">{pesan}</div>
    </Modal>
  );
}

// ---------- toast ----------

type Toast = { id: number; pesan: string; jenis: "sukses" | "galat" | "info" };
const KonteksToast = createContext<(pesan: string, jenis?: Toast["jenis"]) => void>(() => {});

export function PenyediaToast({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([]);
  const tampil = useCallback((pesan: string, jenis: Toast["jenis"] = "sukses") => {
    const id = Date.now() + Math.random();
    setDaftar((d) => [...d, { id, pesan, jenis }]);
    setTimeout(() => setDaftar((d) => d.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <KonteksToast.Provider value={tampil}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 lg:top-auto lg:bottom-6 lg:items-end lg:px-6">
        {daftar.map((t) => {
          const Ikon = t.jenis === "sukses" ? CircleCheck : t.jenis === "galat" ? TriangleAlert : Info;
          return (
            <div
              key={t.id}
              role="status"
              className={cx(
                "clay-sm anim-muncul pointer-events-auto flex max-w-sm items-center gap-3 px-4 py-3 text-sm font-semibold",
                t.jenis === "sukses" && "bg-sage-lembut text-sage-tua",
                t.jenis === "galat" && "bg-coral-lembut text-coral-tua",
                t.jenis === "info" && "bg-langit-lembut text-langit-tua",
              )}
            >
              <Ikon size={18} className="shrink-0" />
              {t.pesan}
            </div>
          );
        })}
      </div>
    </KonteksToast.Provider>
  );
}

export function useToast() {
  return useContext(KonteksToast);
}

// ---------- tata letak halaman ----------

/** Wadah di baris atas (sejajar pencarian & notifikasi) tempat judul halaman ditampilkan di layar lebar. */
export const SlotJudul = createContext<HTMLElement | null>(null);

export function JudulHalaman({ judul, sub, aksi, lencana }: { judul: string; sub?: ReactNode; aksi?: ReactNode; lencana?: ReactNode }) {
  const slot = useContext(SlotJudul);
  const judulEl = (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-bold tracking-tight lg:truncate lg:text-[28px] lg:leading-tight">{judul}</h1>
      {lencana}
    </div>
  );
  return (
    <>
      {/* Layar kecil: judul tetap di atas konten. Layar lg (<1280px): judul di baris atas, tombol aksi tetap di sini agar judul tidak terpotong. */}
      <div
        className={cx(
          "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          slot && (aksi ? "lg:mb-4 lg:justify-end xl:hidden" : "lg:hidden"),
        )}
      >
        <div className={cx(slot && "lg:hidden")}>
          {judulEl}
          {sub && <p className="mt-1 text-sm text-redup">{sub}</p>}
        </div>
        {aksi && <div className="flex flex-wrap gap-3">{aksi}</div>}
      </div>
      {/* Layar lebar: satu baris dengan pemilih TA, pencarian, notifikasi, dan tombol keluar. */}
      {slot &&
        createPortal(
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="min-w-0">
              {judulEl}
              {sub && <p className="truncate text-xs text-redup">{sub}</p>}
            </div>
            {aksi && <div className="ml-auto hidden shrink-0 items-center gap-3 xl:flex">{aksi}</div>}
          </div>,
          slot,
        )}
    </>
  );
}

export function Kosong({ ikon: Ikon, judul, pesan, aksi }: { ikon: LucideIcon; judul: string; pesan?: string; aksi?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-krem-tua text-redup">
        <Ikon size={28} />
      </span>
      <p className="font-display text-lg font-bold">{judul}</p>
      {pesan && <p className="max-w-sm text-sm text-redup">{pesan}</p>}
      {aksi}
    </div>
  );
}

const WARNA_AVATAR = [
  "bg-sage-muda text-sage-tua",
  "bg-coral-muda text-coral-tua",
  "bg-mustard-muda text-mustard-tua",
  "bg-langit-muda text-langit-tua",
  "bg-lavender-muda text-lavender-tua",
];

export function Avatar({ nama, ukuran = 36 }: { nama: string; ukuran?: number }) {
  const bersih = nama.replace(/^(Drs\.|Hj?\.)\s*/g, "").replace(/^(H\.|Hj\.)\s*/, "");
  const inisial = bersih
    .split(/[\s,]+/)
    .filter((k) => /^[A-Za-z]/.test(k) && !k.includes("."))
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase();
  let h = 0;
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      className={cx("grid shrink-0 place-items-center rounded-full font-display font-bold", WARNA_AVATAR[h % WARNA_AVATAR.length])}
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.38 }}
      aria-hidden
    >
      {inisial || "?"}
    </span>
  );
}

// ---------- tabel responsif ----------

export type Kolom<T> = {
  kunci: string;
  label: string;
  isi: (baris: T) => ReactNode;
  kelas?: string;
  /** Sembunyikan di tampilan kartu (layar kecil). */
  sembunyiMobile?: boolean;
};

export function Tabel<T extends { id: string }>({
  kolom,
  baris,
  aksi,
  kosong,
  judulMobile,
}: {
  kolom: Kolom<T>[];
  baris: T[];
  aksi?: (b: T) => ReactNode;
  kosong?: ReactNode;
  judulMobile?: (b: T) => ReactNode;
}) {
  if (baris.length === 0) return <>{kosong}</>;
  return (
    <>
      <div className="scroll-tipis hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs font-bold tracking-wide text-redup uppercase">
              {kolom.map((k) => (
                <th key={k.kunci} className={cx("px-4 py-3 first:pl-6", k.kelas)}>
                  {k.label}
                </th>
              ))}
              {aksi && <th className="px-4 py-3 pr-6 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.id} className="border-t border-garis/70 transition hover:bg-krem/60">
                {kolom.map((k) => (
                  <td key={k.kunci} className={cx("px-4 py-3 first:pl-6", k.kelas)}>
                    {k.isi(b)}
                  </td>
                ))}
                {aksi && (
                  <td className="px-4 py-2 pr-6">
                    <div className="flex justify-end gap-1">{aksi(b)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 p-4 md:hidden">
        {baris.map((b) => (
          <li key={b.id} className="rounded-3xl bg-krem/70 p-4">
            {judulMobile && <div className="mb-2">{judulMobile(b)}</div>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {kolom
                .filter((k) => !k.sembunyiMobile)
                .map((k) => (
                  <div key={k.kunci} className="contents">
                    <dt className="text-redup">{k.label}</dt>
                    <dd className="text-right font-semibold">{k.isi(b)}</dd>
                  </div>
                ))}
            </dl>
            {aksi && <div className="mt-2 flex justify-end gap-1 border-t border-garis pt-2">{aksi(b)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export function Halaman({ total, halaman, perHalaman, ubah }: { total: number; halaman: number; perHalaman: number; ubah: (h: number) => void }) {
  const jumlah = Math.max(1, Math.ceil(total / perHalaman));
  if (total <= perHalaman) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-garis/70 px-6 py-4 text-sm">
      <span className="text-redup">
        {(halaman - 1) * perHalaman + 1}–{Math.min(total, halaman * perHalaman)} dari {total}
      </span>
      <div className="flex gap-2">
        <Tombol varian="kedua" ukuran="sm" disabled={halaman <= 1} onClick={() => ubah(halaman - 1)}>
          Sebelumnya
        </Tombol>
        <Tombol varian="kedua" ukuran="sm" disabled={halaman >= jumlah} onClick={() => ubah(halaman + 1)}>
          Berikutnya
        </Tombol>
      </div>
    </div>
  );
}

export function Pil<T extends string>({ pilihan, nilai, ubah }: { pilihan: { nilai: T; label: string }[]; nilai: T; ubah: (v: T) => void }) {
  return (
    <div className="cekung inline-flex flex-wrap gap-1 rounded-full p-1">
      {pilihan.map((p) => (
        <button
          key={p.nilai}
          type="button"
          onClick={() => ubah(p.nilai)}
          className={cx(
            "rounded-full px-4 py-1.5 text-[13px] font-bold transition",
            p.nilai === nilai ? "clay-sm bg-permukaan text-tinta" : "text-redup hover:text-tinta",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
