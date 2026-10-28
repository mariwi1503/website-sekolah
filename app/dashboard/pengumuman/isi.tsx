"use client";

import { useMemo, useState } from "react";
import { Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react";
import {
  AreaTeks,
  Avatar,
  cx,
  Input,
  Isian,
  JudulHalaman,
  Kartu,
  Konfirmasi,
  Kosong,
  Lencana,
  Modal,
  Pil,
  Pilihan,
  Tombol,
  TombolIkon,
  useToast,
  type Nada,
} from "@/components/ui";
import { hapus, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { Pengumuman, TargetPengumuman } from "@/lib/db/types";
import { pengumumanUntuk, useRombelSaya } from "@/lib/data";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { formatPanjang, hariIni } from "@/lib/tanggal";
import { wajib } from "@/lib/validasi";

const LABEL_TARGET: Record<TargetPengumuman, [string, Nada]> = {
  semua: ["Semua", "sage"],
  guru: ["Khusus guru", "langit"],
  ortu: ["Orang tua", "lavender"],
};

export function IsiPengumuman() {
  const p = usePengguna();
  const toast = useToast();
  const { arsip } = useTahunAjaran();
  const pengumuman = useKoleksi("pengumuman");
  const pengguna = useKoleksi("pengguna");
  const rombel = useKoleksi("rombel");
  const rombelSaya = useRombelSaya(p);
  const pimpinan = punya(p, "admin", "kepsek");
  const [filter, setFilter] = useState<"semua" | TargetPengumuman>("semua");
  const [form, setForm] = useState<{ data?: Pengumuman } | null>(null);
  const [akanHapus, setAkanHapus] = useState<Pengumuman | null>(null);

  const daftar = useMemo(
    () =>
      pengumumanUntuk(pengumuman, p, [], rombelSaya.map((r) => r.id)).filter((x) => filter === "semua" || x.target === filter),
    [pengumuman, p, rombelSaya, filter],
  );

  return (
    <>
      <JudulHalaman
        judul="Pengumuman"
        sub="Informasi untuk guru dan orang tua siswa"
        aksi={
          !arsip && (
            <Tombol ikon={Plus} onClick={() => setForm({})}>
              Buat Pengumuman
            </Tombol>
          )
        }
      />
      <div className="mb-5">
        <Pil
          nilai={filter}
          ubah={setFilter}
          pilihan={[
            { nilai: "semua", label: "Semua" },
            { nilai: "guru", label: "Guru" },
            { nilai: "ortu", label: "Orang Tua" },
          ]}
        />
      </div>
      {daftar.length === 0 ? (
        <Kartu>
          <Kosong ikon={Megaphone} judul="Belum ada pengumuman" />
        </Kartu>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {daftar.map((x) => {
            const penulis = pengguna.find((u) => u.id === x.penulisId);
            const bisa = pimpinan || x.penulisId === p?.id;
            return (
              <Kartu key={x.id} nada={x.disematkan ? "mustard" : undefined} className="flex flex-col gap-3 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {x.disematkan && (
                    <Lencana nada="mustard">
                      <Pin size={12} /> Disematkan
                    </Lencana>
                  )}
                  <Lencana nada={LABEL_TARGET[x.target][1]}>{LABEL_TARGET[x.target][0]}</Lencana>
                  {x.rombelIds.map((id) => (
                    <Lencana key={id} nada="coral">
                      Kelas {rombel.find((r) => r.id === id)?.nama}
                    </Lencana>
                  ))}
                </div>
                <h3 className="text-lg font-bold">{x.judul}</h3>
                <p className="text-sm whitespace-pre-line text-tinta-2">{x.isi}</p>
                <div className="mt-auto flex items-center gap-3 border-t border-garis/70 pt-3">
                  <Avatar nama={penulis?.nama ?? "?"} ukuran={30} />
                  <span className="flex-1 text-xs">
                    <span className="block font-bold">{penulis?.nama ?? "-"}</span>
                    <span className="text-redup">{formatPanjang(x.tanggal)}</span>
                  </span>
                  {bisa && !arsip && (
                    <>
                      <TombolIkon ikon={Pencil} label="Edit" onClick={() => setForm({ data: x })} />
                      <TombolIkon ikon={Trash2} label="Hapus" onClick={() => setAkanHapus(x)} className="hover:text-coral-tua" />
                    </>
                  )}
                </div>
              </Kartu>
            );
          })}
        </div>
      )}

      {form && <FormPengumuman awal={form.data} tutup={() => setForm(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul="Hapus pengumuman?"
        pesan={`“${akanHapus?.judul}” akan dihapus.`}
        onYa={() => {
          if (akanHapus) hapus("pengumuman", akanHapus.id);
          toast("Pengumuman dihapus.");
        }}
      />
    </>
  );
}

function FormPengumuman({ awal, tutup }: { awal?: Pengumuman; tutup: () => void }) {
  const p = usePengguna();
  const toast = useToast();
  const rombelSaya = useRombelSaya(p);
  const pimpinan = punya(p, "admin", "kepsek");
  const [judul, setJudul] = useState(awal?.judul ?? "");
  const [isi, setIsi] = useState(awal?.isi ?? "");
  const [target, setTarget] = useState<TargetPengumuman>(awal?.target ?? (pimpinan ? "semua" : "ortu"));
  const [rombelIds, setRombelIds] = useState<string[]>(awal?.rombelIds ?? []);
  const [disematkan, setDisematkan] = useState(awal?.disematkan ?? false);
  const [galat, setGalat] = useState<{ judul?: string; isi?: string; rombel?: string }>({});

  function simpan() {
    const g = {
      judul: wajib(judul, "Judul"),
      isi: wajib(isi, "Isi pengumuman"),
      // Guru hanya boleh mengumumkan ke orang tua kelas yang diampunya.
      rombel: !pimpinan && target !== "guru" && rombelIds.length === 0 ? "Pilih kelas tujuan." : undefined,
    };
    if (g.judul || g.isi || g.rombel) {
      setGalat(g);
      return;
    }
    const data = { judul: judul.trim(), isi: isi.trim(), target, rombelIds: target === "guru" ? [] : rombelIds, disematkan: pimpinan && disematkan };
    if (awal) ubah("pengumuman", awal.id, data);
    else tambah("pengumuman", { ...data, penulisId: p!.id, tanggal: hariIni() });
    toast(awal ? "Pengumuman diperbarui." : "Pengumuman diterbitkan.");
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={awal ? "Edit Pengumuman" : "Buat Pengumuman"}
      kaki={
        <>
          <Tombol varian="kedua" onClick={tutup}>
            Batal
          </Tombol>
          <Tombol onClick={simpan}>{awal ? "Simpan" : "Terbitkan"}</Tombol>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Isian label="Judul" wajib galat={galat.judul}>
          {(id) => <Input id={id} value={judul} onChange={(e) => setJudul(e.target.value)} autoFocus />}
        </Isian>
        <Isian label="Isi" wajib galat={galat.isi}>
          {(id) => <AreaTeks id={id} rows={5} value={isi} onChange={(e) => setIsi(e.target.value)} />}
        </Isian>
        <Isian label="Ditujukan untuk">
          {(id) => (
            <Pilihan id={id} value={target} onChange={(e) => setTarget(e.target.value as TargetPengumuman)}>
              <option value="semua">Semua (guru dan orang tua)</option>
              <option value="guru">Khusus guru</option>
              <option value="ortu">Orang tua siswa</option>
            </Pilihan>
          )}
        </Isian>
        {target !== "guru" && (
          <div>
            <p className="mb-2 text-[13px] font-bold text-tinta-2">
              Batasi ke kelas {pimpinan ? <span className="font-normal text-redup">(kosongkan untuk semua kelas)</span> : <span className="text-coral">*</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {rombelSaya.map((r) => {
                const on = rombelIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setRombelIds(on ? rombelIds.filter((x) => x !== r.id) : [...rombelIds, r.id]);
                      setGalat({ ...galat, rombel: undefined });
                    }}
                    className={cx("rounded-full px-3.5 py-1.5 text-sm font-bold", on ? "clay-sm bg-coral text-white" : "bg-krem text-tinta-2")}
                  >
                    {r.nama}
                  </button>
                );
              })}
            </div>
            {galat.rombel && <p className="mt-1 text-xs font-semibold text-[#c2463a]">{galat.rombel}</p>}
          </div>
        )}
        {pimpinan && (
          <label className="flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" className="size-4 accent-coral" checked={disematkan} onChange={(e) => setDisematkan(e.target.checked)} />
            Sematkan di urutan teratas
          </label>
        )}
      </div>
    </Modal>
  );
}
