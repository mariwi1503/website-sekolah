"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  Avatar,
  Input,
  Isian,
  JudulHalaman,
  Kartu,
  Konfirmasi,
  Kosong,
  KotakCari,
  Lencana,
  Modal,
  Pilihan,
  Tabel,
  Tombol,
  TombolIkon,
  useToast,
} from "@/components/ui";
import { hapus, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { Guru } from "@/lib/db/types";
import { useRombelTA } from "@/lib/data";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { adaGalat, digit, email, nomorHp, wajib, type Galat } from "@/lib/validasi";

export function IsiGuru() {
  const p = usePengguna();
  const toast = useToast();
  const params = useSearchParams();
  const { dilihat } = useTahunAjaran();
  const guru = useKoleksi("guru");
  const pengguna = useKoleksi("pengguna");
  const pengampu = useKoleksi("pengampu");
  const rombel = useRombelTA(dilihat?.id);
  const admin = punya(p, "admin");
  const [cari, setCari] = useState(params.get("cari") ?? "");
  const [form, setForm] = useState<{ guru?: Guru } | null>(null);
  const [akanHapus, setAkanHapus] = useState<Guru | null>(null);
  const [akanReset, setAkanReset] = useState<Guru | null>(null);

  const baris = useMemo(() => {
    const q = cari.toLowerCase();
    return guru
      .filter((g) => !q || g.nama.toLowerCase().includes(q) || g.nip.includes(q) || g.jabatan.toLowerCase().includes(q))
      .map((g) => ({
        ...g,
        akun: pengguna.find((u) => u.guruId === g.id),
        wali: rombel.find((r) => r.waliKelasGuruId === g.id),
        jumlahMapel: pengampu.filter((x) => x.guruId === g.id && x.tahunAjaranId === dilihat?.id).length,
      }));
  }, [guru, pengguna, rombel, pengampu, cari, dilihat]);

  function cobaHapus(g: Guru) {
    const dipakai =
      semua("rombel").some((r) => r.waliKelasGuruId === g.id) || semua("pengampu").some((x) => x.guruId === g.id);
    if (dipakai) {
      toast(`${g.nama.split(",")[0]} masih tercatat sebagai wali kelas/pengampu. Nonaktifkan lewat Edit agar riwayatnya tetap tersimpan.`, "info");
      return;
    }
    setAkanHapus(g);
  }

  return (
    <>
      <JudulHalaman
        judul="Akun Guru"
        sub={`${guru.filter((g) => g.aktif).length} guru aktif · login guru memakai nama pengguna di bawah`}
        aksi={
          admin && (
            <Tombol ikon={Plus} onClick={() => setForm({})}>
              Tambah Guru
            </Tombol>
          )
        }
      />
      <Kartu className="overflow-hidden">
        <div className="p-5">
          <KotakCari nilai={cari} ubah={setCari} placeholder="Cari nama, NIP, atau jabatan…" className="md:w-96" />
        </div>
        <Tabel
          baris={baris}
          kosong={<Kosong ikon={Users} judul="Guru tidak ditemukan" />}
          judulMobile={(g) => (
            <div className="flex items-center gap-3">
              <Avatar nama={g.nama} />
              <div>
                <p className="font-bold">{g.nama}</p>
                <p className="text-xs text-redup">{g.jabatan}</p>
              </div>
            </div>
          )}
          kolom={[
            {
              kunci: "nama",
              label: "Nama",
              sembunyiMobile: true,
              isi: (g) => (
                <div className="flex items-center gap-3">
                  <Avatar nama={g.nama} />
                  <div>
                    <p className="font-bold">{g.nama}</p>
                    <p className="text-xs text-redup">{g.nip ? `NIP ${g.nip}` : "Non-NIP"}</p>
                  </div>
                </div>
              ),
            },
            { kunci: "jabatan", label: "Jabatan", isi: (g) => g.jabatan },
            { kunci: "status", label: "Kepegawaian", isi: (g) => <Lencana nada={g.statusKepegawaian === "PNS" ? "sage" : g.statusKepegawaian === "PPPK" ? "langit" : "mustard"}>{g.statusKepegawaian}</Lencana> },
            { kunci: "tugas", label: "Tugas TA ini", isi: (g) => (g.wali ? `Wali ${g.wali.nama}` : g.jumlahMapel ? `${g.jumlahMapel} kelas-mapel` : "-") },
            { kunci: "akun", label: "Nama pengguna", isi: (g) => <code className="rounded-lg bg-krem px-2 py-0.5 text-xs">{g.akun?.username ?? "-"}</code> },
            { kunci: "aktif", label: "Status", isi: (g) => (g.aktif ? <Lencana nada="sage">Aktif</Lencana> : <Lencana>Nonaktif</Lencana>) },
          ]}
          aksi={
            admin
              ? (g) => (
                  <>
                    <TombolIkon ikon={KeyRound} label="Reset kata sandi" onClick={() => setAkanReset(g)} />
                    <TombolIkon ikon={Pencil} label="Edit" onClick={() => setForm({ guru: g })} />
                    <TombolIkon ikon={Trash2} label="Hapus" onClick={() => cobaHapus(g)} className="hover:text-coral-tua" />
                  </>
                )
              : undefined
          }
        />
      </Kartu>

      {form && <FormGuru awal={form.guru} tutup={() => setForm(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul="Hapus guru?"
        pesan={
          <>
            Data <b>{akanHapus?.nama}</b> beserta akun loginnya akan dihapus permanen.
          </>
        }
        onYa={() => {
          if (!akanHapus) return;
          semua("pengguna")
            .filter((u) => u.guruId === akanHapus.id)
            .forEach((u) => hapus("pengguna", u.id));
          hapus("guru", akanHapus.id);
          toast("Guru dihapus.");
        }}
      />
      <Konfirmasi
        buka={!!akanReset}
        tutup={() => setAkanReset(null)}
        judul="Reset kata sandi?"
        bahaya={false}
        labelYa="Reset"
        pesan={
          <>
            Kata sandi <b>{akanReset?.nama}</b> akan dikembalikan menjadi <code>guru123</code>.
          </>
        }
        onYa={() => {
          const u = semua("pengguna").find((x) => x.guruId === akanReset?.id);
          if (u) ubah("pengguna", u.id, { password: "guru123" });
          toast("Kata sandi direset menjadi guru123.");
        }}
      />
    </>
  );
}

type DataForm = Omit<Guru, "id"> & { username: string };

function buatUsername(nama: string) {
  return nama
    .split(",")[0]
    .replace(/^(Drs\.|Dra\.|Hj?\.)\s*/i, "")
    .replace(/^(H\.|Hj\.)\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
}

function FormGuru({ awal, tutup }: { awal?: Guru; tutup: () => void }) {
  const toast = useToast();
  const akun = awal ? semua("pengguna").find((u) => u.guruId === awal.id) : undefined;
  const [d, setD] = useState<DataForm>({
    nama: awal?.nama ?? "",
    nip: awal?.nip ?? "",
    nuptk: awal?.nuptk ?? "",
    jk: awal?.jk ?? "P",
    tempatLahir: awal?.tempatLahir ?? "",
    tglLahir: awal?.tglLahir ?? "",
    hp: awal?.hp ?? "",
    email: awal?.email ?? "",
    jabatan: awal?.jabatan ?? "Guru Kelas",
    statusKepegawaian: awal?.statusKepegawaian ?? "PNS",
    aktif: awal?.aktif ?? true,
    username: akun?.username ?? "",
  });
  const [galat, setGalat] = useState<Galat<DataForm>>({});
  const set = <K extends keyof DataForm>(k: K, v: DataForm[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setGalat((g) => ({ ...g, [k]: undefined }));
  };

  function simpan() {
    const username = (d.username || buatUsername(d.nama)).trim().toLowerCase();
    const g: Galat<DataForm> = {
      nama: wajib(d.nama, "Nama"),
      nip:
        d.statusKepegawaian === "Honorer"
          ? digit(d.nip, 18, "NIP", true)
          : digit(d.nip, 18, "NIP") ?? (semua("guru").some((x) => x.nip === d.nip && x.id !== awal?.id) ? "NIP sudah terdaftar." : undefined),
      nuptk: digit(d.nuptk, 16, "NUPTK", true),
      hp: nomorHp(d.hp, true),
      email: email(d.email),
      username: !username
        ? "Nama pengguna wajib diisi."
        : semua("pengguna").some((u) => u.username === username && u.id !== akun?.id)
          ? "Nama pengguna sudah dipakai."
          : undefined,
    };
    if (adaGalat(g)) {
      setGalat(g);
      return;
    }
    const { username: _u, ...data } = d;
    void _u;
    const bersih = { ...data, nama: data.nama.trim() };
    if (awal) {
      ubah("guru", awal.id, bersih);
      if (akun) ubah("pengguna", akun.id, { username, nama: bersih.nama });
      toast("Data guru diperbarui.");
    } else {
      const baru = tambah("guru", bersih);
      tambah("pengguna", { username, password: "guru123", nama: baru.nama, peran: ["guru"], guruId: baru.id });
      toast(`${baru.nama.split(",")[0]} ditambahkan. Login: ${username} / guru123`);
    }
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={awal ? "Edit Guru" : "Tambah Guru"}
      deskripsi="Akun login dibuat otomatis dengan kata sandi awal guru123."
      lebar="lg"
      kaki={
        <>
          <Tombol varian="kedua" onClick={tutup}>
            Batal
          </Tombol>
          <Tombol onClick={simpan}>Simpan</Tombol>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Isian label="Nama lengkap dan gelar" wajib galat={galat.nama} className="sm:col-span-2">
          {(id) => <Input id={id} value={d.nama} onChange={(e) => set("nama", e.target.value)} placeholder="contoh: Siti Aminah, S.Pd." autoFocus />}
        </Isian>
        <Isian label="Status kepegawaian" wajib>
          {(id) => (
            <Pilihan id={id} value={d.statusKepegawaian} onChange={(e) => set("statusKepegawaian", e.target.value as Guru["statusKepegawaian"])}>
              <option>PNS</option>
              <option>PPPK</option>
              <option>Honorer</option>
            </Pilihan>
          )}
        </Isian>
        <Isian label="NIP" wajib={d.statusKepegawaian !== "Honorer"} galat={galat.nip} bantuan="18 digit">
          {(id) => <Input id={id} inputMode="numeric" maxLength={18} value={d.nip} onChange={(e) => set("nip", e.target.value.replace(/\D/g, ""))} />}
        </Isian>
        <Isian label="NUPTK" galat={galat.nuptk} bantuan="16 digit, opsional">
          {(id) => <Input id={id} inputMode="numeric" maxLength={16} value={d.nuptk} onChange={(e) => set("nuptk", e.target.value.replace(/\D/g, ""))} />}
        </Isian>
        <Isian label="Jabatan">
          {(id) => (
            <Pilihan id={id} value={d.jabatan} onChange={(e) => set("jabatan", e.target.value)}>
              {["Guru Kelas", "Guru PAI", "Guru PJOK", "Guru Bahasa Inggris", "Guru Mapel", "Kepala Sekolah"].map((j) => (
                <option key={j}>{j}</option>
              ))}
            </Pilihan>
          )}
        </Isian>
        <Isian label="Jenis kelamin">
          {(id) => (
            <Pilihan id={id} value={d.jk} onChange={(e) => set("jk", e.target.value as "L" | "P")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Pilihan>
          )}
        </Isian>
        <Isian label="Tempat lahir">{(id) => <Input id={id} value={d.tempatLahir} onChange={(e) => set("tempatLahir", e.target.value)} />}</Isian>
        <Isian label="Tanggal lahir">{(id) => <Input id={id} type="date" value={d.tglLahir} onChange={(e) => set("tglLahir", e.target.value)} />}</Isian>
        <Isian label="Nomor HP" galat={galat.hp}>
          {(id) => <Input id={id} inputMode="tel" value={d.hp} onChange={(e) => set("hp", e.target.value)} />}
        </Isian>
        <Isian label="Email" galat={galat.email}>
          {(id) => <Input id={id} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} />}
        </Isian>
        <Isian label="Nama pengguna (login)" galat={galat.username} bantuan={!d.username && d.nama ? `Otomatis: ${buatUsername(d.nama)}` : undefined}>
          {(id) => <Input id={id} value={d.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))} />}
        </Isian>
        <Isian label="Status">
          {(id) => (
            <Pilihan id={id} value={d.aktif ? "1" : "0"} onChange={(e) => set("aktif", e.target.value === "1")}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif (pensiun/mutasi)</option>
            </Pilihan>
          )}
        </Isian>
      </div>
    </Modal>
  );
}
