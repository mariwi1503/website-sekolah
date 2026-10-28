"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, HeartHandshake, School, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Memuat } from "@/components/gerbang";
import { LogoLengkap } from "@/components/logo";
import { IkonBulat, Input, Isian, Kartu, Tombol, useToast, type Nada } from "@/components/ui";
import { semua, useSiapDiBrowser } from "@/lib/db/store";
import { berandaUntuk, masuk, usePengguna } from "@/lib/sesi";

const AKUN_DEMO: { id: string; label: string; ket: string; ikon: LucideIcon; nada: Nada }[] = [
  { id: "pgn_admin", label: "Operator Sekolah", ket: "Kelola semua data induk", ikon: ShieldCheck, nada: "sage" },
  { id: "pgn_gr_01", label: "Kepala Sekolah", ket: "Pantau seluruh kegiatan", ikon: School, nada: "coral" },
  { id: "pgn_gr_08", label: "Wali Kelas 4A", ket: "Absensi & data kelasnya", ikon: GraduationCap, nada: "mustard" },
  { id: "pgn_gr_16", label: "Guru PJOK", ket: "Guru mata pelajaran", ikon: Users, nada: "langit" },
  { id: "pgn_ortu_demo", label: "Orang Tua", ket: "Portal HP, 2 anak", ikon: HeartHandshake, nada: "lavender" },
];

export function FormMasuk() {
  const siap = useSiapDiBrowser();
  const pengguna = usePengguna();
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [galat, setGalat] = useState("");

  useEffect(() => {
    if (pengguna) router.replace(berandaUntuk(pengguna));
  }, [pengguna, router]);

  if (!siap || pengguna) return <Memuat />;

  function masukSebagai(id: string) {
    const p = semua("pengguna").find((x) => x.id === id);
    if (!p) {
      toast("Akun demo tidak ditemukan. Coba Reset Data Demo.", "galat");
      return;
    }
    masuk(p.id);
    toast(`Selamat datang, ${p.nama.split(",")[0]}!`);
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const p = semua("pengguna").find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!p || p.password !== password) {
      setGalat("Nama pengguna atau kata sandi salah.");
      return;
    }
    masukSebagai(p.id);
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 p-4 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-6">
        <LogoLengkap />
        <div>
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
            Administrasi sekolah yang <span className="text-coral">lebih ringan</span> untuk guru.
          </h1>
          <p className="mt-3 max-w-lg text-tinta-2">
            Absensi, data kelas, pengumuman, dan informasi untuk orang tua dalam satu tempat.
          </p>
        </div>

        <Kartu className="p-6 sm:p-7">
          <h2 className="text-lg font-bold">Masuk cepat (akun demo)</h2>
          <p className="mb-4 text-sm text-redup">Pilih peran untuk mencoba prototipe tanpa kata sandi.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {AKUN_DEMO.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => masukSebagai(a.id)}
                className="clay-sm flex items-center gap-3 bg-permukaan p-3 text-left transition hover:-translate-y-0.5"
              >
                <IkonBulat ikon={a.ikon} nada={a.nada} ukuran="sm" />
                <span>
                  <span className="block text-sm font-bold">{a.label}</span>
                  <span className="block text-xs text-redup">{a.ket}</span>
                </span>
              </button>
            ))}
          </div>
        </Kartu>
      </div>

      <Kartu className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold">Masuk</h2>
        <p className="mb-6 text-sm text-redup">Gunakan nama pengguna dan kata sandi Anda.</p>
        <form onSubmit={kirim} className="flex flex-col gap-4">
          <Isian label="Nama pengguna" bantuan="Guru: nama.depan · Orang tua: nomor HP">
            {(id) => (
              <Input id={id} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="contoh: admin" />
            )}
          </Isian>
          <Isian label="Kata sandi" galat={galat}>
            {(id) => (
              <Input
                id={id}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setGalat("");
                }}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            )}
          </Isian>
          <Tombol type="submit" className="mt-2 w-full">
            Masuk
          </Tombol>
        </form>
        <div className="mt-6 rounded-2xl bg-krem p-4 text-xs leading-relaxed text-tinta-2">
          <p className="mb-1 font-bold">Kata sandi demo</p>
          admin / admin123 · kepsek / kepsek123 · guru: <i>nurul.hidayah</i> / guru123 · orang tua: 081234567816 / ortu123
        </div>
      </Kartu>
    </div>
  );
}
