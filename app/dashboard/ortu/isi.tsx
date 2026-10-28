"use client";

import { useMemo, useState } from "react";
import { HeartHandshake, KeyRound, Pencil, Trash2 } from "lucide-react";
import {
  Avatar,
  Halaman,
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
import { hapus, semua, ubah, useKoleksi } from "@/lib/db/store";
import type { Ortu } from "@/lib/db/types";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { adaGalat, nomorHp, wajib } from "@/lib/validasi";

const PER_HALAMAN = 20;

export function IsiOrtu() {
  const p = usePengguna();
  const toast = useToast();
  const { aktif } = useTahunAjaran();
  const ortu = useKoleksi("ortu");
  const siswa = useKoleksi("siswa");
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const rombel = useKoleksi("rombel");
  const admin = punya(p, "admin");
  const [cari, setCari] = useState("");
  const [hal, setHal] = useState(1);
  const [edit, setEdit] = useState<Ortu | null>(null);
  const [akanHapus, setAkanHapus] = useState<Ortu | null>(null);
  const [akanReset, setAkanReset] = useState<Ortu | null>(null);

  const baris = useMemo(() => {
    const kelasSiswa = (id: string) => {
      const k = keanggotaan.find((x) => x.siswaId === id && x.tahunAjaranId === aktif?.id);
      return rombel.find((r) => r.id === k?.rombelId)?.nama;
    };
    const q = cari.toLowerCase();
    return ortu
      .map((o) => ({
        ...o,
        anak: o.siswaIds.map((id) => ({ s: siswa.find((x) => x.id === id), kelas: kelasSiswa(id) })).filter((a) => a.s),
      }))
      .filter((o) => !q || o.nama.toLowerCase().includes(q) || o.hp.includes(q) || o.anak.some((a) => a.s!.nama.toLowerCase().includes(q)))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [ortu, siswa, keanggotaan, rombel, aktif, cari]);

  return (
    <>
      <JudulHalaman judul="Orang Tua / Wali" sub={`${ortu.length} akun orang tua · login portal memakai nomor HP`} />
      <Kartu className="overflow-hidden">
        <div className="p-5">
          <KotakCari
            nilai={cari}
            ubah={(v) => {
              setCari(v);
              setHal(1);
            }}
            placeholder="Cari nama orang tua, nomor HP, atau nama anak…"
            className="md:w-[28rem]"
          />
        </div>
        <Tabel
          baris={baris.slice((hal - 1) * PER_HALAMAN, hal * PER_HALAMAN)}
          kosong={<Kosong ikon={HeartHandshake} judul="Tidak ditemukan" />}
          judulMobile={(o) => (
            <div className="flex items-center gap-3">
              <Avatar nama={o.nama} />
              <div>
                <p className="font-bold">{o.nama}</p>
                <p className="text-xs text-redup">{o.hubungan}</p>
              </div>
            </div>
          )}
          kolom={[
            {
              kunci: "nama",
              label: "Nama",
              sembunyiMobile: true,
              isi: (o) => (
                <div className="flex items-center gap-3">
                  <Avatar nama={o.nama} />
                  <div>
                    <p className="font-bold">{o.nama}</p>
                    <p className="text-xs text-redup">
                      {o.hubungan} · {o.pekerjaan || "-"}
                    </p>
                  </div>
                </div>
              ),
            },
            { kunci: "hp", label: "Nomor HP / login", isi: (o) => <code className="rounded-lg bg-krem px-2 py-0.5 text-xs">{o.hp}</code> },
            {
              kunci: "anak",
              label: "Anak",
              isi: (o) => (
                <div className="flex flex-wrap justify-end gap-1 md:justify-start">
                  {o.anak.map((a) => (
                    <Lencana key={a.s!.id} nada={a.kelas ? "coral" : "netral"}>
                      {a.s!.nama.split(" ").slice(0, 2).join(" ")} {a.kelas ? `· ${a.kelas}` : `· ${a.s!.status}`}
                    </Lencana>
                  ))}
                </div>
              ),
            },
          ]}
          aksi={
            admin
              ? (o) => (
                  <>
                    <TombolIkon ikon={KeyRound} label="Reset kata sandi" onClick={() => setAkanReset(o)} />
                    <TombolIkon ikon={Pencil} label="Edit" onClick={() => setEdit(o)} />
                    <TombolIkon
                      ikon={Trash2}
                      label="Hapus"
                      className="hover:text-coral-tua"
                      onClick={() =>
                        o.anak.some((a) => a.s!.status === "aktif")
                          ? toast("Orang tua masih terhubung dengan siswa aktif. Ubah data orang tuanya saja.", "info")
                          : setAkanHapus(o)
                      }
                    />
                  </>
                )
              : undefined
          }
        />
        <Halaman total={baris.length} halaman={hal} perHalaman={PER_HALAMAN} ubah={setHal} />
      </Kartu>

      {edit && <FormOrtu awal={edit} tutup={() => setEdit(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul="Hapus orang tua?"
        pesan={`Akun ${akanHapus?.nama} akan dihapus dan tidak bisa login lagi.`}
        onYa={() => {
          if (!akanHapus) return;
          semua("pengguna")
            .filter((u) => u.ortuId === akanHapus.id)
            .forEach((u) => hapus("pengguna", u.id));
          hapus("ortu", akanHapus.id);
          toast("Data orang tua dihapus.");
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
            Kata sandi <b>{akanReset?.nama}</b> akan dikembalikan menjadi <code>ortu123</code>.
          </>
        }
        onYa={() => {
          const u = semua("pengguna").find((x) => x.ortuId === akanReset?.id);
          if (u) ubah("pengguna", u.id, { password: "ortu123" });
          toast("Kata sandi direset menjadi ortu123.");
        }}
      />
    </>
  );
}

function FormOrtu({ awal, tutup }: { awal: Ortu; tutup: () => void }) {
  const toast = useToast();
  const [d, setD] = useState({ nama: awal.nama, hubungan: awal.hubungan, hp: awal.hp, pekerjaan: awal.pekerjaan });
  const [galat, setGalat] = useState<{ nama?: string; hp?: string }>({});

  function simpan() {
    const hp = d.hp.replace(/[\s-]/g, "");
    const g = {
      nama: wajib(d.nama, "Nama"),
      hp: nomorHp(hp) ?? (semua("ortu").some((o) => o.hp === hp && o.id !== awal.id) ? "Nomor HP sudah dipakai akun lain." : undefined),
    };
    if (adaGalat(g)) {
      setGalat(g);
      return;
    }
    ubah("ortu", awal.id, { ...d, nama: d.nama.trim(), hp });
    const u = semua("pengguna").find((x) => x.ortuId === awal.id);
    if (u) ubah("pengguna", u.id, { username: hp, nama: d.nama.trim() });
    toast("Data orang tua diperbarui.");
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul="Edit Orang Tua"
      deskripsi="Mengubah nomor HP juga mengubah nama pengguna untuk login portal."
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
        <Isian label="Nama" wajib galat={galat.nama} className="sm:col-span-2">
          {(id) => <Input id={id} value={d.nama} onChange={(e) => setD({ ...d, nama: e.target.value })} />}
        </Isian>
        <Isian label="Hubungan">
          {(id) => (
            <Pilihan id={id} value={d.hubungan} onChange={(e) => setD({ ...d, hubungan: e.target.value as Ortu["hubungan"] })}>
              <option>Ibu</option>
              <option>Ayah</option>
              <option>Wali</option>
            </Pilihan>
          )}
        </Isian>
        <Isian label="Nomor HP" wajib galat={galat.hp}>
          {(id) => <Input id={id} inputMode="tel" value={d.hp} onChange={(e) => setD({ ...d, hp: e.target.value })} />}
        </Isian>
        <Isian label="Pekerjaan" className="sm:col-span-2">
          {(id) => <Input id={id} value={d.pekerjaan} onChange={(e) => setD({ ...d, pekerjaan: e.target.value })} />}
        </Isian>
      </div>
    </Modal>
  );
}
