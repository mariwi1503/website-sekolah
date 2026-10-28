"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownAZ, BookOpen, Pencil, Plus, School, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import {
  Avatar,
  IkonBulat,
  Input,
  Isian,
  JudulHalaman,
  Kartu,
  Konfirmasi,
  Kosong,
  KotakCari,
  Lencana,
  Modal,
  Pil,
  Pilihan,
  Tombol,
  TombolIkon,
  useToast,
} from "@/components/ui";
import { hapus, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { Rombel } from "@/lib/db/types";
import { anggotaDari, hitungPresensi, urutkanNoAbsen, useRombelSaya, useRombelTA } from "@/lib/data";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { wajib } from "@/lib/validasi";

const WARNA_TINGKAT = ["bg-coral", "bg-mustard", "bg-sage", "bg-langit", "bg-lavender", "bg-coral-tua"];

export function IsiKelas() {
  const p = usePengguna();
  const params = useSearchParams();
  const toast = useToast();
  const { dilihat, arsip } = useTahunAjaran();
  const rombelSaya = useRombelSaya(p);
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const siswa = useKoleksi("siswa");
  const guru = useKoleksi("guru");
  const presensi = useKoleksi("presensi");
  const admin = punya(p, "admin");
  const bisaUbah = admin && !arsip;

  const [form, setForm] = useState<{ rombel?: Rombel } | null>(null);
  const [lihat, setLihat] = useState<string | null>(params.get("rombel"));
  const [akanHapus, setAkanHapus] = useState<Rombel | null>(null);

  const kartu = useMemo(
    () =>
      rombelSaya.map((r) => {
        const anggota = keanggotaan.filter((k) => k.rombelId === r.id);
        const jk = anggota.map((k) => siswa.find((s) => s.id === k.siswaId)?.jk);
        return {
          r,
          jumlah: anggota.length,
          L: jk.filter((x) => x === "L").length,
          P: jk.filter((x) => x === "P").length,
          wali: guru.find((g) => g.id === r.waliKelasGuruId),
          rekap: hitungPresensi(presensi.filter((x) => x.rombelId === r.id)),
        };
      }),
    [rombelSaya, keanggotaan, siswa, guru, presensi],
  );

  function cobaHapus(r: Rombel) {
    if (keanggotaan.some((k) => k.rombelId === r.id)) {
      toast(`Kelas ${r.nama} masih memiliki siswa. Pindahkan atau keluarkan siswanya terlebih dahulu.`, "galat");
      return;
    }
    setAkanHapus(r);
  }

  return (
    <>
      <JudulHalaman
        judul={admin || punya(p, "kepsek") ? "Data Kelas" : "Kelas Saya"}
        sub={`${rombelSaya.length} rombongan belajar · TA ${dilihat?.nama}`}
        aksi={
          bisaUbah && (
            <Tombol ikon={Plus} onClick={() => setForm({})}>
              Tambah Kelas
            </Tombol>
          )
        }
      />

      {kartu.length === 0 ? (
        <Kartu>
          <Kosong ikon={School} judul="Belum ada kelas" pesan="Tidak ada rombel pada tahun ajaran ini yang bisa Anda akses." />
        </Kartu>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {kartu.map(({ r, jumlah, L, P, wali, rekap }) => (
            <Kartu key={r.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-4">
                <span
                  className={`clay-sm grid size-16 shrink-0 place-items-center font-display text-2xl font-bold text-white ${WARNA_TINGKAT[(r.tingkat - 1) % 6]}`}
                >
                  {r.nama}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold">Kelas {r.nama}</p>
                  <p className="truncate text-sm text-redup">Wali: {wali?.nama ?? "Belum ditentukan"}</p>
                  {r.waliKelasGuruId === p?.guruId && <Lencana nada="sage">Kelas perwalian Anda</Lencana>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-krem/80 py-2">
                  <p className="font-display text-xl font-bold">{jumlah}</p>
                  <p className="text-[11px] font-semibold text-redup">Siswa</p>
                </div>
                <div className="rounded-2xl bg-krem/80 py-2">
                  <p className="font-display text-xl font-bold">
                    {L}/{P}
                  </p>
                  <p className="text-[11px] font-semibold text-redup">L / P</p>
                </div>
                <div className="rounded-2xl bg-krem/80 py-2">
                  <p className="font-display text-xl font-bold">{rekap.total ? `${Math.round(rekap.persenHadir)}%` : "–"}</p>
                  <p className="text-[11px] font-semibold text-redup">Hadir</p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Tombol varian="kedua" ukuran="sm" ikon={Users} className="flex-1" onClick={() => setLihat(r.id)}>
                  Lihat Kelas
                </Tombol>
                {bisaUbah && (
                  <>
                    <TombolIkon ikon={Pencil} label="Edit kelas" onClick={() => setForm({ rombel: r })} />
                    <TombolIkon ikon={Trash2} label="Hapus kelas" onClick={() => cobaHapus(r)} className="hover:text-coral-tua" />
                  </>
                )}
              </div>
            </Kartu>
          ))}
        </div>
      )}

      {form && <FormRombel awal={form.rombel} tutup={() => setForm(null)} />}
      {lihat && <DetailRombel rombelId={lihat} tutup={() => setLihat(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul={`Hapus Kelas ${akanHapus?.nama}?`}
        pesan="Kelas ini tidak memiliki siswa. Data pengampu mata pelajarannya juga akan dihapus."
        onYa={() => {
          if (!akanHapus) return;
          semua("pengampu")
            .filter((x) => x.rombelId === akanHapus.id)
            .forEach((x) => hapus("pengampu", x.id));
          hapus("rombel", akanHapus.id);
          toast(`Kelas ${akanHapus.nama} dihapus.`);
        }}
      />
    </>
  );
}

function FormRombel({ awal, tutup }: { awal?: Rombel; tutup: () => void }) {
  const toast = useToast();
  const { aktif } = useTahunAjaran();
  const rombelTA = useRombelTA(aktif?.id);
  const guru = useKoleksi("guru");
  const mapel = useKoleksi("mapel");
  const [tingkat, setTingkat] = useState(awal?.tingkat ?? 1);
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [wali, setWali] = useState(awal?.waliKelasGuruId ?? "");
  const [galat, setGalat] = useState<{ nama?: string; wali?: string }>({});

  const saranNama = useMemo(() => {
    const dipakai = new Set(rombelTA.map((r) => r.nama));
    for (const h of "ABCDEFG") if (!dipakai.has(`${tingkat}${h}`)) return `${tingkat}${h}`;
    return `${tingkat}`;
  }, [rombelTA, tingkat]);

  function simpan() {
    const n = (nama || saranNama).trim().toUpperCase();
    const g = {
      nama: wajib(n, "Nama kelas") ?? (rombelTA.some((r) => r.nama === n && r.id !== awal?.id) ? `Kelas ${n} sudah ada di TA ini.` : undefined),
      wali: (() => {
        const lain = rombelTA.find((r) => wali && r.waliKelasGuruId === wali && r.id !== awal?.id);
        return lain ? `Guru ini sudah menjadi wali Kelas ${lain.nama}.` : undefined;
      })(),
    };
    if (g.nama || g.wali) {
      setGalat(g);
      return;
    }
    if (awal) {
      ubah("rombel", awal.id, { tingkat, nama: n, waliKelasGuruId: wali || null });
      toast(`Kelas ${n} diperbarui.`);
    } else if (aktif) {
      const r = tambah("rombel", { tahunAjaranId: aktif.id, tingkat, nama: n, waliKelasGuruId: wali || null });
      // Mapel umum diampu wali kelas secara bawaan; dapat diubah di detail kelas.
      for (const m of mapel.filter((x) => x.tingkatBerlaku.includes(tingkat))) {
        tambah("pengampu", { tahunAjaranId: aktif.id, rombelId: r.id, mapelId: m.id, guruId: wali || "" });
      }
      toast(`Kelas ${n} ditambahkan.`);
    }
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={awal ? `Edit Kelas ${awal.nama}` : "Tambah Kelas"}
      deskripsi={`Tahun ajaran ${aktif?.nama}`}
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
        <Isian label="Tingkat" wajib>
          {(id) => (
            <Pilihan id={id} value={tingkat} onChange={(e) => setTingkat(Number(e.target.value))} disabled={!!awal}>
              {[1, 2, 3, 4, 5, 6].map((t) => (
                <option key={t} value={t}>
                  Kelas {t}
                </option>
              ))}
            </Pilihan>
          )}
        </Isian>
        <Isian label="Nama rombel" galat={galat.nama} bantuan={`Kosongkan untuk memakai saran: ${saranNama}`}>
          {(id) => <Input id={id} value={nama} placeholder={saranNama} onChange={(e) => setNama(e.target.value)} />}
        </Isian>
        <Isian label="Wali kelas" galat={galat.wali}>
          {(id) => (
            <Pilihan id={id} value={wali} onChange={(e) => setWali(e.target.value)}>
              <option value="">— Belum ditentukan —</option>
              {guru
                .filter((g) => g.aktif)
                .map((g) => {
                  const sudah = rombelTA.find((r) => r.waliKelasGuruId === g.id && r.id !== awal?.id);
                  return (
                    <option key={g.id} value={g.id}>
                      {g.nama}
                      {sudah ? ` (wali ${sudah.nama})` : ""}
                    </option>
                  );
                })}
            </Pilihan>
          )}
        </Isian>
      </div>
    </Modal>
  );
}

function DetailRombel({ rombelId, tutup }: { rombelId: string; tutup: () => void }) {
  const p = usePengguna();
  const toast = useToast();
  const { arsip } = useTahunAjaran();
  const rombel = useKoleksi("rombel").find((r) => r.id === rombelId);
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const siswa = useKoleksi("siswa");
  const guru = useKoleksi("guru");
  const mapel = useKoleksi("mapel");
  const pengampu = useKoleksi("pengampu");
  const presensi = useKoleksi("presensi");
  const [tab, setTab] = useState<"siswa" | "mapel">("siswa");
  const [tambahBuka, setTambahBuka] = useState(false);
  const bisaUbah = punya(p, "admin") && !arsip;

  const anggota = useMemo(() => anggotaDari(keanggotaan, rombelId), [keanggotaan, rombelId]);
  if (!rombel) return null;

  function keluarkan(kkId: string, nama: string) {
    if (presensi.some((x) => x.status[kkId])) {
      toast(`${nama} sudah punya catatan absensi di kelas ini. Ubah status siswa (pindah/keluar) dari menu Data Siswa.`, "info");
      return;
    }
    hapus("keanggotaanKelas", kkId);
    toast(`${nama} dikeluarkan dari Kelas ${rombel!.nama}.`);
  }

  return (
    <Modal buka tutup={tutup} judul={`Kelas ${rombel.nama}`} deskripsi={`Wali kelas: ${guru.find((g) => g.id === rombel.waliKelasGuruId)?.nama ?? "-"}`} lebar="lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Pil
          nilai={tab}
          ubah={setTab}
          pilihan={[
            { nilai: "siswa", label: `Siswa (${anggota.length})` },
            { nilai: "mapel", label: "Mata Pelajaran" },
          ]}
        />
        {bisaUbah && tab === "siswa" && (
          <div className="flex gap-2">
            <Tombol
              varian="kedua"
              ukuran="sm"
              ikon={ArrowDownAZ}
              onClick={() => {
                urutkanNoAbsen(rombel.id);
                toast("Nomor absen diurutkan sesuai abjad.");
              }}
            >
              Urutkan No. Absen
            </Tombol>
            <Tombol ukuran="sm" ikon={UserPlus} onClick={() => setTambahBuka(true)}>
              Tambah Siswa
            </Tombol>
          </div>
        )}
      </div>

      {tab === "siswa" ? (
        anggota.length === 0 ? (
          <Kosong ikon={Users} judul="Belum ada siswa" pesan="Tambahkan siswa ke kelas ini." />
        ) : (
          <ul className="divide-y divide-garis/70">
            {anggota.map((k) => {
              const s = siswa.find((x) => x.id === k.siswaId);
              if (!s) return null;
              return (
                <li key={k.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-7 text-right text-sm font-bold text-redup">{k.noAbsen}</span>
                  <Avatar nama={s.nama} ukuran={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{s.nama}</span>
                    <span className="block text-xs text-redup">
                      NISN {s.nisn} · {s.jk === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </span>
                  {k.statusAkhir !== "aktif" && <Lencana nada="mustard">{k.statusAkhir}</Lencana>}
                  {bisaUbah && <TombolIkon ikon={UserMinus} label="Keluarkan dari kelas" onClick={() => keluarkan(k.id, s.nama)} />}
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {pengampu
            .filter((x) => x.rombelId === rombel.id)
            .map((x) => {
              const m = mapel.find((y) => y.id === x.mapelId);
              return (
                <li key={x.id} className="flex flex-col gap-2 rounded-2xl bg-krem/70 p-3 sm:flex-row sm:items-center">
                  <span className="flex flex-1 items-center gap-3">
                    <IkonBulat ikon={BookOpen} nada="langit" ukuran="sm" />
                    <span className="text-sm font-bold">{m?.nama ?? "-"}</span>
                  </span>
                  {bisaUbah ? (
                    <div className="sm:w-64">
                      <Pilihan
                        aria-label={`Guru pengampu ${m?.nama}`}
                        value={x.guruId}
                        onChange={(e) => {
                          ubah("pengampu", x.id, { guruId: e.target.value });
                          toast("Guru pengampu diperbarui.");
                        }}
                      >
                        <option value="">— Belum ada —</option>
                        {guru.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nama}
                          </option>
                        ))}
                      </Pilihan>
                    </div>
                  ) : (
                    <span className="text-sm text-tinta-2">{guru.find((g) => g.id === x.guruId)?.nama ?? "-"}</span>
                  )}
                </li>
              );
            })}
        </ul>
      )}

      {tambahBuka && <TambahAnggota rombel={rombel} tutup={() => setTambahBuka(false)} />}
    </Modal>
  );
}

function TambahAnggota({ rombel, tutup }: { rombel: Rombel; tutup: () => void }) {
  const toast = useToast();
  const siswa = useKoleksi("siswa");
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const [cari, setCari] = useState("");
  const [pilih, setPilih] = useState<Set<string>>(new Set());

  const tersedia = useMemo(() => {
    const sudah = new Set(keanggotaan.filter((k) => k.tahunAjaranId === rombel.tahunAjaranId).map((k) => k.siswaId));
    const q = cari.toLowerCase();
    return siswa.filter((s) => s.status === "aktif" && !sudah.has(s.id) && (!q || s.nama.toLowerCase().includes(q) || s.nisn.includes(q)));
  }, [siswa, keanggotaan, rombel, cari]);

  function simpan() {
    let no = Math.max(0, ...keanggotaan.filter((k) => k.rombelId === rombel.id).map((k) => k.noAbsen));
    for (const id of pilih) {
      tambah("keanggotaanKelas", { siswaId: id, rombelId: rombel.id, tahunAjaranId: rombel.tahunAjaranId, noAbsen: ++no, statusAkhir: "aktif" });
    }
    toast(`${pilih.size} siswa ditambahkan ke Kelas ${rombel.nama}.`);
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={`Tambah Siswa ke Kelas ${rombel.nama}`}
      deskripsi="Hanya siswa aktif yang belum punya kelas di tahun ajaran ini."
      kaki={
        <>
          <Tombol varian="kedua" onClick={tutup}>
            Batal
          </Tombol>
          <Tombol onClick={simpan} disabled={pilih.size === 0}>
            Tambahkan {pilih.size > 0 && `(${pilih.size})`}
          </Tombol>
        </>
      }
    >
      <KotakCari nilai={cari} ubah={setCari} placeholder="Cari nama atau NISN…" className="mb-3" />
      {tersedia.length === 0 ? (
        <Kosong ikon={Users} judul="Tidak ada siswa tersedia" pesan="Semua siswa aktif sudah memiliki kelas. Tambahkan siswa baru di menu Data Siswa." />
      ) : (
        <ul className="flex flex-col gap-1">
          {tersedia.map((s) => (
            <li key={s.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 hover:bg-krem">
                <input
                  type="checkbox"
                  className="size-4 accent-coral"
                  checked={pilih.has(s.id)}
                  onChange={(e) => {
                    const n = new Set(pilih);
                    if (e.target.checked) n.add(s.id);
                    else n.delete(s.id);
                    setPilih(n);
                  }}
                />
                <Avatar nama={s.nama} ukuran={30} />
                <span className="text-sm font-bold">{s.nama}</span>
                <span className="ml-auto text-xs text-redup">NISN {s.nisn}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
