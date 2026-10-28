"use client";

import { useMemo, useState } from "react";
import { Archive, ArrowRight, CalendarRange, Eye, GraduationCap, Pencil, TriangleAlert } from "lucide-react";
import { cx, IkonBulat, Input, Isian, JudulHalaman, Kartu, Lencana, Modal, Pilihan, Tombol, useToast } from "@/components/ui";
import { gantiSemua, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { KeanggotaanKelas, Rombel, StatusKeanggotaan, TahunAjaran } from "@/lib/db/types";
import { anggotaDari, urutkanNoAbsen, useRombelTA } from "@/lib/data";
import { pilihTahunAjaran, punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { formatPendek } from "@/lib/tanggal";
import { wajib } from "@/lib/validasi";

export function IsiTahunAjaran() {
  const p = usePengguna();
  const { semua: daftar, dilihat } = useTahunAjaran();
  const rombel = useKoleksi("rombel");
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const admin = punya(p, "admin");
  const [edit, setEdit] = useState<TahunAjaran | null>(null);
  const [kenaikan, setKenaikan] = useState(false);

  return (
    <>
      <JudulHalaman
        judul="Tahun Ajaran"
        sub="Data setiap tahun ajaran disimpan permanen. Tahun yang ditutup menjadi arsip baca-saja."
        aksi={
          admin && (
            <Tombol ikon={GraduationCap} onClick={() => setKenaikan(true)}>
              Kenaikan Kelas & TA Baru
            </Tombol>
          )
        }
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {daftar.map((t) => {
          const jRombel = rombel.filter((r) => r.tahunAjaranId === t.id).length;
          const jSiswa = keanggotaan.filter((k) => k.tahunAjaranId === t.id).length;
          return (
            <Kartu key={t.id} nada={t.status === "aktif" ? "sage" : undefined} className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-4">
                <IkonBulat ikon={t.status === "aktif" ? CalendarRange : Archive} nada={t.status === "aktif" ? "sage" : "netral"} />
                <div className="flex-1">
                  <p className="font-display text-2xl font-bold">{t.nama}</p>
                  <p className="text-xs text-redup">
                    {formatPendek(t.tglMulai)} – {formatPendek(t.tglSelesai)}
                  </p>
                </div>
                {t.status === "aktif" ? <Lencana nada="sage">Aktif · Smt {t.semesterAktif}</Lencana> : <Lencana>Arsip</Lencana>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-permukaan/80 py-2">
                  <p className="font-display text-xl font-bold">{jRombel}</p>
                  <p className="text-[11px] font-semibold text-redup">Rombel</p>
                </div>
                <div className="rounded-2xl bg-permukaan/80 py-2">
                  <p className="font-display text-xl font-bold">{jSiswa}</p>
                  <p className="text-[11px] font-semibold text-redup">Siswa tercatat</p>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <Tombol varian="kedua" ukuran="sm" ikon={Eye} className="flex-1" disabled={dilihat?.id === t.id} onClick={() => pilihTahunAjaran(t.id)}>
                  {dilihat?.id === t.id ? "Sedang dilihat" : "Lihat data TA ini"}
                </Tombol>
                {admin && t.status === "aktif" && (
                  <Tombol varian="kedua" ukuran="sm" ikon={Pencil} onClick={() => setEdit(t)}>
                    Edit
                  </Tombol>
                )}
              </div>
            </Kartu>
          );
        })}
      </div>
      {edit && <FormTA awal={edit} tutup={() => setEdit(null)} />}
      {kenaikan && <WizardKenaikan tutup={() => setKenaikan(false)} />}
    </>
  );
}

function FormTA({ awal, tutup }: { awal: TahunAjaran; tutup: () => void }) {
  const toast = useToast();
  const [d, setD] = useState({ nama: awal.nama, tglMulai: awal.tglMulai, tglSelesai: awal.tglSelesai, semesterAktif: awal.semesterAktif });
  const [galat, setGalat] = useState<{ nama?: string; tgl?: string }>({});
  function simpan() {
    const g = {
      nama: wajib(d.nama, "Nama") ?? (!/^\d{4}\/\d{4}$/.test(d.nama) ? "Format: 2026/2027" : undefined),
      tgl: d.tglSelesai <= d.tglMulai ? "Tanggal selesai harus setelah tanggal mulai." : undefined,
    };
    if (g.nama || g.tgl) {
      setGalat(g);
      return;
    }
    ubah("tahunAjaran", awal.id, d);
    toast("Tahun ajaran diperbarui.");
    tutup();
  }
  return (
    <Modal
      buka
      tutup={tutup}
      judul={`Edit TA ${awal.nama}`}
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
        <Isian label="Nama" galat={galat.nama}>
          {(id) => <Input id={id} value={d.nama} onChange={(e) => setD({ ...d, nama: e.target.value })} />}
        </Isian>
        <Isian label="Semester aktif" bantuan="Mengubah semester memengaruhi semester pada absensi dan rapor baru.">
          {(id) => (
            <Pilihan id={id} value={d.semesterAktif} onChange={(e) => setD({ ...d, semesterAktif: Number(e.target.value) as 1 | 2 })}>
              <option value={1}>Semester 1 (Ganjil)</option>
              <option value={2}>Semester 2 (Genap)</option>
            </Pilihan>
          )}
        </Isian>
        <div className="grid grid-cols-2 gap-3">
          <Isian label="Mulai">{(id) => <Input id={id} type="date" value={d.tglMulai} onChange={(e) => setD({ ...d, tglMulai: e.target.value })} />}</Isian>
          <Isian label="Selesai" galat={galat.tgl}>
            {(id) => <Input id={id} type="date" value={d.tglSelesai} onChange={(e) => setD({ ...d, tglSelesai: e.target.value })} />}
          </Isian>
        </div>
      </div>
    </Modal>
  );
}

// ---------- kenaikan kelas ----------

type Keputusan = Exclude<StatusKeanggotaan, "aktif">;

const LABEL_KEPUTUSAN: Record<Keputusan, string> = { naik: "Naik", tinggal: "Tinggal", lulus: "Lulus", pindah: "Pindah" };

function WizardKenaikan({ tutup }: { tutup: () => void }) {
  const toast = useToast();
  const { aktif } = useTahunAjaran();
  const rombelLama = useRombelTA(aktif?.id);
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const siswa = useKoleksi("siswa");
  const [langkah, setLangkah] = useState(1);

  const thAwal = Number(aktif?.nama.slice(5) ?? new Date().getFullYear());
  const [ta, setTa] = useState({ nama: `${thAwal}/${thAwal + 1}`, tglMulai: `${thAwal}-07-13`, tglSelesai: `${thAwal + 1}-06-20` });
  const [keputusan, setKeputusan] = useState<Record<string, Keputusan>>(() =>
    Object.fromEntries(
      keanggotaan
        .filter((k) => k.tahunAjaranId === aktif?.id)
        .map((k) => {
          const r = rombelLama.find((x) => x.id === k.rombelId);
          return [k.id, k.statusAkhir === "pindah" ? "pindah" : r?.tingkat === 6 ? "lulus" : "naik"];
        }),
    ),
  );
  const [galat, setGalat] = useState("");

  const ringkas = useMemo(() => {
    const j: Record<Keputusan, number> = { naik: 0, tinggal: 0, lulus: 0, pindah: 0 };
    Object.values(keputusan).forEach((v) => j[v]++);
    return j;
  }, [keputusan]);

  if (!aktif) return null;

  function lanjut() {
    if (semua("tahunAjaran").some((t) => t.nama === ta.nama)) {
      setGalat(`TA ${ta.nama} sudah ada.`);
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(ta.nama) || ta.tglSelesai <= ta.tglMulai) {
      setGalat("Periksa nama (format 2027/2028) dan tanggal tahun ajaran.");
      return;
    }
    setGalat("");
    setLangkah(2);
  }

  function proses() {
    const taBaru = tambah("tahunAjaran", { ...ta, semesterAktif: 1, status: "aktif" });
    ubah("tahunAjaran", aktif!.id, { status: "ditutup" });

    // Rombel baru dengan struktur & wali kelas yang sama (bisa diubah setelahnya).
    const peta = new Map<string, Rombel>();
    for (const r of rombelLama) {
      const baru = tambah("rombel", { tahunAjaranId: taBaru.id, tingkat: r.tingkat, nama: r.nama, waliKelasGuruId: r.waliKelasGuruId });
      peta.set(r.nama, baru);
    }
    for (const x of semua("pengampu").filter((x) => x.tahunAjaranId === aktif!.id)) {
      const lama = rombelLama.find((r) => r.id === x.rombelId);
      const baru = lama && peta.get(lama.nama);
      if (baru) tambah("pengampu", { tahunAjaranId: taBaru.id, rombelId: baru.id, mapelId: x.mapelId, guruId: x.guruId });
    }

    const kkBaru: KeanggotaanKelas[] = [];
    const semuaKk = semua("keanggotaanKelas").map((k) => {
      const kep = keputusan[k.id];
      if (!kep) return k;
      const r = rombelLama.find((x) => x.id === k.rombelId)!;
      let tujuan: Rombel | undefined;
      if (kep === "naik") {
        tujuan = peta.get(`${r.tingkat + 1}${r.nama.slice(1)}`) ?? [...peta.values()].find((x) => x.tingkat === r.tingkat + 1);
      } else if (kep === "tinggal") {
        tujuan = peta.get(r.nama);
      }
      if (tujuan) {
        kkBaru.push({ id: `kk_${taBaru.id.slice(3)}_${k.siswaId}`, siswaId: k.siswaId, rombelId: tujuan.id, tahunAjaranId: taBaru.id, noAbsen: 0, statusAkhir: "aktif" });
      }
      return { ...k, statusAkhir: kep };
    });
    gantiSemua("keanggotaanKelas", [...semuaKk, ...kkBaru]);
    for (const [kkId, kep] of Object.entries(keputusan)) {
      if (kep === "lulus" || kep === "pindah") {
        const k = keanggotaan.find((x) => x.id === kkId);
        if (k) ubah("siswa", k.siswaId, { status: kep });
      }
    }
    peta.forEach((r) => urutkanNoAbsen(r.id));
    pilihTahunAjaran(taBaru.id);
    toast(`TA ${taBaru.nama} aktif. ${ringkas.naik} siswa naik kelas, ${ringkas.lulus} lulus. Data TA ${aktif!.nama} tersimpan sebagai arsip.`);
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul="Kenaikan Kelas & Tahun Ajaran Baru"
      deskripsi={`Langkah ${langkah} dari 3`}
      lebar="xl"
      kaki={
        <>
          <Tombol varian="kedua" onClick={langkah === 1 ? tutup : () => setLangkah(langkah - 1)}>
            {langkah === 1 ? "Batal" : "Kembali"}
          </Tombol>
          {langkah === 1 && (
            <Tombol ikon={ArrowRight} onClick={lanjut}>
              Lanjut
            </Tombol>
          )}
          {langkah === 2 && (
            <Tombol ikon={ArrowRight} onClick={() => setLangkah(3)}>
              Lanjut
            </Tombol>
          )}
          {langkah === 3 && <Tombol onClick={proses}>Proses Kenaikan Kelas</Tombol>}
        </>
      }
    >
      {langkah === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-3xl bg-mustard-lembut p-4 text-sm">
            <TriangleAlert size={20} className="shrink-0 text-mustard-tua" />
            <p>
              Biasanya dilakukan setelah pembagian rapor semester genap. TA <b>{aktif.nama}</b> akan ditutup menjadi arsip baca-saja; seluruh nilai, absensi,
              dan riwayat kelasnya tetap tersimpan.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Isian label="Nama TA baru">{(id) => <Input id={id} value={ta.nama} onChange={(e) => setTa({ ...ta, nama: e.target.value })} />}</Isian>
            <Isian label="Mulai">{(id) => <Input id={id} type="date" value={ta.tglMulai} onChange={(e) => setTa({ ...ta, tglMulai: e.target.value })} />}</Isian>
            <Isian label="Selesai">{(id) => <Input id={id} type="date" value={ta.tglSelesai} onChange={(e) => setTa({ ...ta, tglSelesai: e.target.value })} />}</Isian>
          </div>
          {galat && <p className="text-sm font-semibold text-[#c2463a]">{galat}</p>}
        </div>
      )}

      {langkah === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-2">
            Tentukan status setiap siswa. Bawaan: kelas 1–5 <b>naik</b>, kelas 6 <b>lulus</b>. Klik untuk mengubah, misalnya menjadi tinggal kelas.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {rombelLama.map((r) => (
              <div key={r.id} className="rounded-3xl border border-garis p-4">
                <p className="mb-2 font-display font-bold">
                  Kelas {r.nama} <ArrowRight size={14} className="inline" /> {r.tingkat === 6 ? "Lulus" : `Kelas ${r.tingkat + 1}${r.nama.slice(1)}`}
                </p>
                <ul className="flex flex-col gap-1">
                  {anggotaDari(keanggotaan, r.id).map((k) => {
                    const opsi: Keputusan[] = r.tingkat === 6 ? ["lulus", "tinggal", "pindah"] : ["naik", "tinggal", "pindah"];
                    return (
                      <li key={k.id} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{siswa.find((s) => s.id === k.siswaId)?.nama}</span>
                        {opsi.map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => setKeputusan({ ...keputusan, [k.id]: o })}
                            className={cx(
                              "rounded-full px-2.5 py-0.5 text-xs font-bold",
                              keputusan[k.id] === o
                                ? o === "tinggal"
                                  ? "bg-mustard text-white"
                                  : o === "pindah"
                                    ? "bg-coral text-white"
                                    : "bg-sage text-white"
                                : "bg-krem text-redup",
                            )}
                          >
                            {LABEL_KEPUTUSAN[o]}
                          </button>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {langkah === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-2">Periksa ringkasan berikut sebelum diproses:</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(LABEL_KEPUTUSAN) as Keputusan[]).map((k) => (
              <div key={k} className="rounded-2xl bg-krem p-4 text-center">
                <p className="font-display text-3xl font-bold">{ringkas[k]}</p>
                <p className="text-xs font-bold text-redup">{LABEL_KEPUTUSAN[k]}</p>
              </div>
            ))}
          </div>
          <ul className="list-disc pl-5 text-sm text-tinta-2">
            <li>
              TA <b>{ta.nama}</b> dibuat dan menjadi aktif; TA {aktif.nama} menjadi arsip.
            </li>
            <li>{rombelLama.length} rombel dibuat ulang dengan wali kelas dan pengampu yang sama (bisa diubah di Data Kelas).</li>
            <li>Kelas 1 baru masih kosong; tambahkan siswa baru melalui menu Data Siswa.</li>
            <li>Tidak bisa dibatalkan, kecuali dengan Reset Data Demo di Pengaturan.</li>
          </ul>
        </div>
      )}
    </Modal>
  );
}
