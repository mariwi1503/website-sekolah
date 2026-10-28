"use client";

import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Input, Isian, JudulHalaman, Kartu, Konfirmasi, Kosong, Lencana, Modal, Pilihan, Tabel, Tombol, TombolIkon, useToast, cx } from "@/components/ui";
import { hapus, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { Mapel } from "@/lib/db/types";
import { punya, usePengguna } from "@/lib/sesi";
import { wajib } from "@/lib/validasi";

export function IsiMapel() {
  const p = usePengguna();
  const toast = useToast();
  const mapel = useKoleksi("mapel");
  const admin = punya(p, "admin");
  const [form, setForm] = useState<{ mapel?: Mapel } | null>(null);
  const [akanHapus, setAkanHapus] = useState<Mapel | null>(null);

  return (
    <>
      <JudulHalaman
        judul="Mata Pelajaran"
        sub="Struktur Kurikulum Merdeka jenjang SD"
        aksi={
          admin && (
            <Tombol ikon={Plus} onClick={() => setForm({})}>
              Tambah Mapel
            </Tombol>
          )
        }
      />
      <Kartu className="overflow-hidden">
        <Tabel
          baris={mapel}
          kosong={<Kosong ikon={BookOpen} judul="Belum ada mata pelajaran" />}
          judulMobile={(m) => <p className="font-bold">{m.nama}</p>}
          kolom={[
            { kunci: "kode", label: "Kode", isi: (m) => <code className="rounded-lg bg-krem px-2 py-0.5 text-xs font-bold">{m.kode}</code> },
            { kunci: "nama", label: "Nama", isi: (m) => <span className="font-bold">{m.nama}</span>, sembunyiMobile: true },
            { kunci: "kelompok", label: "Kelompok", isi: (m) => <Lencana nada={m.kelompok === "Umum" ? "langit" : "lavender"}>{m.kelompok}</Lencana> },
            { kunci: "tingkat", label: "Kelas", isi: (m) => m.tingkatBerlaku.join(", ") },
          ]}
          aksi={
            admin
              ? (m) => (
                  <>
                    <TombolIkon ikon={Pencil} label="Edit" onClick={() => setForm({ mapel: m })} />
                    <TombolIkon
                      ikon={Trash2}
                      label="Hapus"
                      className="hover:text-coral-tua"
                      onClick={() =>
                        semua("pengampu").some((x) => x.mapelId === m.id)
                          ? toast("Mapel ini sudah dipakai di kelas (pengampu). Hapus dari kelas terlebih dahulu.", "galat")
                          : setAkanHapus(m)
                      }
                    />
                  </>
                )
              : undefined
          }
        />
      </Kartu>
      {form && <FormMapel awal={form.mapel} tutup={() => setForm(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul="Hapus mata pelajaran?"
        pesan={`${akanHapus?.nama} akan dihapus.`}
        onYa={() => {
          if (akanHapus) hapus("mapel", akanHapus.id);
          toast("Mata pelajaran dihapus.");
        }}
      />
    </>
  );
}

function FormMapel({ awal, tutup }: { awal?: Mapel; tutup: () => void }) {
  const toast = useToast();
  const [kode, setKode] = useState(awal?.kode ?? "");
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [kelompok, setKelompok] = useState<Mapel["kelompok"]>(awal?.kelompok ?? "Umum");
  const [tingkat, setTingkat] = useState<number[]>(awal?.tingkatBerlaku ?? [1, 2, 3, 4, 5, 6]);
  const [galat, setGalat] = useState<{ kode?: string; nama?: string; tingkat?: string }>({});

  function simpan() {
    const k = kode.trim().toUpperCase();
    const g = {
      kode: wajib(k, "Kode") ?? (semua("mapel").some((m) => m.kode === k && m.id !== awal?.id) ? "Kode sudah dipakai." : undefined),
      nama: wajib(nama, "Nama"),
      tingkat: tingkat.length === 0 ? "Pilih minimal satu kelas." : undefined,
    };
    if (g.kode || g.nama || g.tingkat) {
      setGalat(g);
      return;
    }
    const data = { kode: k, nama: nama.trim(), kelompok, tingkatBerlaku: [...tingkat].sort() };
    if (awal) ubah("mapel", awal.id, data);
    else tambah("mapel", data);
    toast(awal ? "Mata pelajaran diperbarui." : "Mata pelajaran ditambahkan. Atur guru pengampunya di menu Data Kelas.");
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={awal ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
      lebar="sm"
      kaki={
        <>
          <Tombol varian="kedua" onClick={tutup}>
            Batal
          </Tombol>
          <Tombol onClick={simpan}>Simpan</Tombol>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Isian label="Kode" wajib galat={galat.kode}>
          {(id) => <Input id={id} value={kode} maxLength={6} onChange={(e) => setKode(e.target.value)} placeholder="contoh: MTK" />}
        </Isian>
        <Isian label="Nama" wajib galat={galat.nama}>
          {(id) => <Input id={id} value={nama} onChange={(e) => setNama(e.target.value)} />}
        </Isian>
        <Isian label="Kelompok">
          {(id) => (
            <Pilihan id={id} value={kelompok} onChange={(e) => setKelompok(e.target.value as Mapel["kelompok"])}>
              <option>Umum</option>
              <option>Muatan Lokal</option>
            </Pilihan>
          )}
        </Isian>
        <div>
          <p className="mb-2 text-[13px] font-bold text-tinta-2">Berlaku untuk kelas</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((t) => {
              const on = tingkat.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTingkat(on ? tingkat.filter((x) => x !== t) : [...tingkat, t])}
                  className={cx("size-10 rounded-xl text-sm font-bold", on ? "clay-sm bg-sage text-white" : "bg-krem text-redup")}
                >
                  {t}
                </button>
              );
            })}
          </div>
          {galat.tingkat && <p className="mt-1 text-xs font-semibold text-[#c2463a]">{galat.tingkat}</p>}
        </div>
      </div>
    </Modal>
  );
}
