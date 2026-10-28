"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  Archive,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Crown,
  GraduationCap,
  HeartHandshake,
  House,
  LogOut,
  Megaphone,
  Menu,
  NotebookPen,
  School,
  Search,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useKoleksi } from "@/lib/db/store";
import type { Peran } from "@/lib/db/types";
import { pengumumanUntuk, useRombelSaya } from "@/lib/data";
import { keluar, LABEL_PERAN, pilihTahunAjaran, punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { formatPendek, hariIni, tambahHari } from "@/lib/tanggal";
import { KlienSaja } from "./gerbang";
import { LogoLengkap } from "./logo";
import { Avatar, cx, SlotJudul, Tombol, type Nada } from "./ui";

type ItemMenu = {
  href: string;
  label: string;
  ikon: LucideIcon;
  nada: Nada;
  peran: Peran[];
  segera?: boolean;
  utamaMobile?: boolean;
};

const MENU: { grup: string; item: ItemMenu[] }[] = [
  {
    grup: "Utama",
    item: [
      { href: "/dashboard", label: "Dashboard", ikon: House, nada: "sage", peran: ["admin", "kepsek", "guru"], utamaMobile: true },
      { href: "/dashboard/kelas", label: "Data Kelas", ikon: School, nada: "coral", peran: ["admin", "kepsek", "guru"], utamaMobile: true },
      { href: "/dashboard/siswa", label: "Data Siswa", ikon: GraduationCap, nada: "mustard", peran: ["admin", "kepsek", "guru"] },
      { href: "/dashboard/presensi", label: "Absensi Siswa", ikon: CalendarCheck, nada: "langit", peran: ["admin", "kepsek", "guru"], utamaMobile: true },
      { href: "/dashboard/nilai", label: "Nilai & Leger", ikon: ClipboardList, nada: "lavender", peran: ["admin", "kepsek", "guru"], segera: true },
      { href: "/dashboard/jurnal", label: "Jurnal Mengajar", ikon: NotebookPen, nada: "sage", peran: ["admin", "kepsek", "guru"], segera: true },
      { href: "/dashboard/pengumuman", label: "Pengumuman", ikon: Megaphone, nada: "coral", peran: ["admin", "kepsek", "guru"], utamaMobile: true },
      { href: "/dashboard/kalender", label: "Kalender Akademik", ikon: CalendarDays, nada: "mustard", peran: ["admin", "kepsek", "guru"] },
    ],
  },
  {
    grup: "Data Induk",
    item: [
      { href: "/dashboard/guru", label: "Akun Guru", ikon: Users, nada: "coral", peran: ["admin", "kepsek"] },
      { href: "/dashboard/ortu", label: "Orang Tua", ikon: HeartHandshake, nada: "lavender", peran: ["admin", "kepsek"] },
      { href: "/dashboard/mapel", label: "Mata Pelajaran", ikon: BookOpen, nada: "langit", peran: ["admin", "kepsek"] },
      { href: "/dashboard/tahun-ajaran", label: "Tahun Ajaran", ikon: Archive, nada: "sage", peran: ["admin", "kepsek"] },
      { href: "/dashboard/pengaturan", label: "Pengaturan", ikon: Settings, nada: "netral", peran: ["admin"] },
    ],
  },
];

const IKON_NADA: Record<Nada, string> = {
  sage: "bg-sage-muda text-sage-tua",
  coral: "bg-coral-muda text-coral-tua",
  mustard: "bg-mustard-muda text-mustard-tua",
  langit: "bg-langit-muda text-langit-tua",
  lavender: "bg-lavender-muda text-lavender-tua",
  netral: "bg-krem-tua text-tinta-2",
};

function aktifKah(path: string, href: string) {
  return href === "/dashboard" ? path === href : path.startsWith(href);
}

function useMenu() {
  const p = usePengguna();
  return useMemo(() => MENU.map((g) => ({ ...g, item: g.item.filter((i) => punya(p, ...i.peran)) })).filter((g) => g.item.length), [p]);
}

function Sidebar({ onPilih }: { onPilih?: () => void }) {
  const p = usePengguna();
  const path = usePathname();
  const menu = useMenu();
  const peranUtama = p?.peran.includes("kepsek") ? "kepsek" : p?.peran[0];
  const namaPendek = p?.nama.split(",")[0] ?? "";

  return (
    <div className="flex h-full flex-col gap-4 rounded-[2rem] bg-sage-muda p-5 shadow-[inset_2px_2px_4px_rgb(255_255_255/0.7),12px_14px_30px_rgb(120_150_135/0.18)]">
      <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
        <div className="relative rounded-full bg-permukaan p-2 shadow-[6px_8px_18px_rgb(100_130_115/0.25),inset_2px_2px_3px_white]">
          <Avatar nama={p?.nama ?? "?"} ukuran={60} />
          <span className="absolute right-1 bottom-1 size-4 rounded-full bg-sage ring-[3px] ring-permukaan" />
        </div>
        <p className="mt-1 font-display text-[17px] leading-tight font-bold">Hai, {namaPendek}! 👋</p>
        <p className="text-xs font-semibold text-tinta-2">{peranUtama ? LABEL_PERAN[peranUtama] : ""}</p>
      </div>

      {/* Di HP pemilih tahun ajaran dipindah dari baris atas ke menu ini. */}
      <div className="sm:hidden">
        <PemilihTahunAjaran />
      </div>

      <nav className="scroll-tipis -mx-1 flex-1 overflow-y-auto px-1">
        {menu.map((g) => (
          <div key={g.grup} className="mb-3">
            <p className="mb-1.5 px-3 text-[11px] font-bold tracking-wider text-sage-tua/70 uppercase">{g.grup}</p>
            <ul className="flex flex-col gap-1">
              {g.item.map((i) => {
                const aktif = aktifKah(path, i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onPilih}
                      className={cx(
                        "flex items-center gap-3 rounded-2xl px-3 py-2 text-[14px] font-bold transition",
                        aktif ? "clay-sm bg-permukaan text-tinta" : "text-tinta-2 hover:bg-white/50",
                      )}
                    >
                      <span className={cx("grid size-8 place-items-center rounded-xl", IKON_NADA[i.nada])}>
                        <i.ikon size={17} strokeWidth={2.3} />
                      </span>
                      <span className="flex-1">{i.label}</span>
                      {i.segera && <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-redup">Segera</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="clay-sm flex items-center gap-3 bg-coral-muda/80 p-3">
        <span className="clay-sm grid size-9 shrink-0 place-items-center rounded-xl bg-mustard text-white">
          <Crown size={17} />
        </span>
        <p className="flex-1 text-[11px] leading-tight text-tinta-2">Prototipe — data tersimpan di browser ini.</p>
        <Tombol
          ukuran="sm"
          ikon={LogOut}
          aria-label="Keluar"
          onClick={() => {
            onPilih?.();
            keluar();
          }}
        />
      </div>
    </div>
  );
}

function PemilihTahunAjaran() {
  const { dilihat, semua } = useTahunAjaran();
  return (
    <label className="clay-sm relative flex h-11 items-center gap-2 bg-permukaan pr-9 pl-4 text-sm font-bold">
      <CalendarDays size={16} className="text-sage-tua" />
      <span className="sr-only">Tahun ajaran</span>
      <select value={dilihat?.id ?? ""} onChange={(e) => pilihTahunAjaran(e.target.value)} className="appearance-none bg-transparent outline-none">
        {semua.map((t) => (
          <option key={t.id} value={t.id}>
            TA {t.nama}
            {t.status === "ditutup" ? " (Arsip)" : ""}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 text-redup" />
    </label>
  );
}

function PencarianGlobal() {
  const [q, setQ] = useState("");
  const [buka, setBuka] = useState(false);
  // Di bawah layar xl, pencarian berupa ikon yang membuka panel di atas layar.
  const [panel, setPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const siswa = useKoleksi("siswa");
  const guru = useKoleksi("guru");
  const p = usePengguna();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const rombelSaya = useRombelSaya(p);

  useEffect(() => {
    const klik = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      setBuka(false);
      setPanel(false);
    };
    document.addEventListener("mousedown", klik);
    return () => document.removeEventListener("mousedown", klik);
  }, []);

  const hasil = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (k.length < 2) return [];
    const r: { label: string; sub: string; href: string }[] = [];
    rombelSaya
      .filter((x) => `kelas ${x.nama}`.toLowerCase().includes(k) || x.nama.toLowerCase() === k)
      .slice(0, 3)
      .forEach((x) => r.push({ label: `Kelas ${x.nama}`, sub: "Rombel", href: `/dashboard/kelas?rombel=${x.id}` }));
    siswa
      .filter((s) => s.nama.toLowerCase().includes(k) || s.nisn.includes(k))
      .slice(0, 6)
      .forEach((s) => r.push({ label: s.nama, sub: `Siswa · NISN ${s.nisn}`, href: `/dashboard/siswa?cari=${encodeURIComponent(s.nama)}` }));
    if (punya(p, "admin", "kepsek"))
      guru
        .filter((g) => g.nama.toLowerCase().includes(k))
        .slice(0, 3)
        .forEach((g) => r.push({ label: g.nama, sub: `Guru · ${g.jabatan}`, href: `/dashboard/guru?cari=${encodeURIComponent(g.nama.split(",")[0])}` }));
    return r;
  }, [q, siswa, guru, rombelSaya, p]);

  const tutup = () => {
    setBuka(false);
    setPanel(false);
    setQ("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // flushSync agar input sudah tampil dan bisa difokuskan dalam gestur yang sama (keyboard HP langsung muncul).
          flushSync(() => setPanel(true));
          inputRef.current?.focus();
        }}
        aria-label="Cari"
        className="clay-sm grid size-11 shrink-0 place-items-center rounded-full bg-permukaan text-tinta-2 xl:hidden"
      >
        <Search size={19} />
      </button>
      <div ref={ref} className={panel ? "anim-muncul fixed inset-x-3 top-3 z-50 sm:left-auto sm:w-96" : "relative hidden w-72 xl:block xl:w-80"}>
        <label className={cx("cekung flex h-11 items-center gap-2 rounded-full px-4", panel && "clay-sm bg-permukaan")}>
          <Search size={17} className="text-redup" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setBuka(true);
            }}
            onFocus={() => setBuka(true)}
            placeholder="Cari siswa, guru, kelas…"
            ref={inputRef}
            className="w-full bg-transparent text-sm outline-none placeholder:text-redup/80"
          />
          {panel && (
            <button type="button" onClick={tutup} aria-label="Tutup pencarian" className="text-redup">
              <X size={18} />
            </button>
          )}
        </label>
        {buka && q.trim().length >= 2 && (
          <div className="clay anim-muncul absolute top-13 right-0 left-0 z-40 overflow-hidden p-2">
            {hasil.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-redup">Tidak ada hasil untuk “{q}”.</p>
            ) : (
              hasil.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    tutup();
                    router.push(h.href);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-krem"
                >
                  <Avatar nama={h.label} ukuran={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{h.label}</span>
                    <span className="block truncate text-xs text-redup">{h.sub}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Notifikasi() {
  const p = usePengguna();
  const semua = useKoleksi("pengumuman");
  const rombelSaya = useRombelSaya(p);
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const daftar = useMemo(
    () =>
      pengumumanUntuk(
        semua,
        p,
        [],
        rombelSaya.map((r) => r.id),
      ).filter((x) => x.tanggal >= tambahHari(hariIni(), -7)),
    [semua, p, rombelSaya],
  );

  useEffect(() => {
    const klik = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setBuka(false);
    document.addEventListener("mousedown", klik);
    return () => document.removeEventListener("mousedown", klik);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-label="Notifikasi"
        className="clay-sm relative grid size-11 place-items-center rounded-full bg-permukaan text-tinta-2"
      >
        <Bell size={19} />
        {daftar.length > 0 && (
          <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-coral text-[10px] font-bold text-white ring-2 ring-krem">
            {daftar.length}
          </span>
        )}
      </button>
      {buka && (
        <div className="clay anim-muncul absolute top-13 right-0 z-40 w-80 p-3">
          <p className="px-2 pb-2 font-display font-bold">Pengumuman 7 hari terakhir</p>
          {daftar.length === 0 ? (
            <p className="px-2 py-4 text-sm text-redup">Belum ada pengumuman baru.</p>
          ) : (
            daftar.slice(0, 5).map((x) => (
              <Link key={x.id} href="/dashboard/pengumuman" onClick={() => setBuka(false)} className="block rounded-2xl px-2 py-2 hover:bg-krem">
                <span className="block text-sm font-bold">{x.judul}</span>
                <span className="block text-xs text-redup">{formatPendek(x.tanggal)}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NavBawah() {
  const path = usePathname();
  const menu = useMenu();
  const utama = menu.flatMap((g) => g.item).filter((i) => i.utamaMobile);
  return (
    <nav className="no-print fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <ul className="clay flex justify-around px-2 py-2">
        {utama.map((i) => {
          const aktif = aktifKah(path, i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                className={cx(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[11px] font-bold",
                  aktif ? "bg-coral-muda text-coral-tua" : "text-redup",
                )}
              >
                <i.ikon size={20} />
                {i.label.replace("Absensi Siswa", "Absensi").replace("Data ", "")}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Kerangka({ children }: { children: ReactNode }) {
  const [laci, setLaci] = useState(false);
  const [slotJudul, setSlotJudul] = useState<HTMLDivElement | null>(null);
  const { arsip, dilihat, aktif } = useTahunAjaran();

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1680px] gap-6 p-3 pb-28 sm:p-5 sm:pb-28 lg:p-6 lg:pb-6">
      <aside className="no-print sticky top-6 hidden h-[calc(100dvh-3rem)] w-[290px] shrink-0 lg:block">
        <Sidebar />
      </aside>

      {laci && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-tinta/30" onClick={() => setLaci(false)} />
          <div className="anim-muncul absolute inset-y-3 left-3 w-[290px] max-w-[85vw]">
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setLaci(false)}
              className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-white/70"
            >
              <X size={18} />
            </button>
            <Sidebar onPilih={() => setLaci(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="no-print mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLaci(true)}
            aria-label="Buka menu"
            className="clay-sm grid size-11 shrink-0 place-items-center rounded-full bg-permukaan lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden">
            <LogoLengkap kecil />
          </div>
          <div className="flex-1 lg:hidden" />
          {/* Di layar lebar, judul halaman (JudulHalaman) dipindahkan ke sini lewat portal. */}
          <div ref={setSlotJudul} className="hidden min-w-0 flex-1 lg:flex" />
          <div className="hidden shrink-0 sm:block">
            <PemilihTahunAjaran />
          </div>
          <KlienSaja>
            <PencarianGlobal />
            <Notifikasi />
          </KlienSaja>
          <button
            type="button"
            onClick={keluar}
            aria-label="Keluar"
            title="Keluar"
            className="clay-sm hidden size-11 place-items-center rounded-full bg-sage-muda text-sage-tua lg:grid"
          >
            <LogOut size={19} />
          </button>
        </header>

        {arsip && (
          <div className="clay-sm mb-6 flex flex-wrap items-center gap-3 bg-mustard-lembut px-5 py-3 text-sm">
            <Archive size={18} className="text-mustard-tua" />
            <span className="flex-1">
              Anda sedang melihat <b>arsip TA {dilihat?.nama}</b>. Data hanya bisa dibaca.
            </span>
            {aktif && (
              <button type="button" onClick={() => pilihTahunAjaran(aktif.id)} className="font-bold text-mustard-tua underline">
                Kembali ke TA {aktif.nama}
              </button>
            )}
          </div>
        )}

        <SlotJudul.Provider value={slotJudul}>
          <main>{children}</main>
        </SlotJudul.Provider>
      </div>

      <NavBawah />
    </div>
  );
}
