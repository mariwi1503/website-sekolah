"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { cx, Input, Isian, JudulHalaman, Kartu, Konfirmasi, Kosong, Lencana, Modal, Pilihan, Tombol, TombolIkon, useToast, type Nada } from "@/components/ui";
import { hapus, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { Kalender } from "@/lib/db/types";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { dariISO, formatPendek, HARI_SINGKAT, hariIni, NAMA_BULAN, tambahHari } from "@/lib/tanggal";
import { wajib } from "@/lib/validasi";

const JENIS: Record<Kalender["jenis"], [string, Nada, string]> = {
  libur: ["Libur", "coral", "bg-coral-muda text-coral-tua"],
  ujian: ["Ujian / Asesmen", "langit", "bg-langit-muda text-langit-tua"],
  kegiatan: ["Kegiatan", "mustard", "bg-mustard-muda text-mustard-tua"],
};

export function IsiKalender() {
  const p = usePengguna();
  const toast = useToast();
  const { dilihat, arsip } = useTahunAjaran();
  const kalender = useKoleksi("kalender");
  const bisaUbah = punya(p, "admin", "kepsek") && !arsip;
  const [bulan, setBulan] = useState(hariIni().slice(0, 7));
  const [form, setForm] = useState<{ data?: Kalender; tanggal?: string } | null>(null);
  const [akanHapus, setAkanHapus] = useState<Kalender | null>(null);

  const daftarBulan = useMemo(() => {
    if (!dilihat) return [];
    const hasil: string[] = [];
    for (let d = dilihat.tglMulai.slice(0, 7); d <= dilihat.tglSelesai.slice(0, 7); ) {
      hasil.push(d);
      const [y, m] = d.split("-").map(Number);
      d = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    }
    return hasil;
  }, [dilihat]);
  const bulanAktif = daftarBulan.includes(bulan) ? bulan : daftarBulan[0] ?? bulan;

  const sel = useMemo(() => {
    const [y, m] = bulanAktif.split("-").map(Number);
    const awal = `${bulanAktif}-01`;
    const geser = (dariISO(awal).getDay() + 6) % 7; // Senin = kolom pertama
    const jumlah = new Date(y, m, 0).getDate();
    return [
      ...Array.from({ length: geser }, () => null),
      ...Array.from({ length: jumlah }, (_, i) => tambahHari(awal, i)),
    ];
  }, [bulanAktif]);

  const daftar = useMemo(
    () =>
      kalender
        .filter((k) => dilihat && k.tglSelesai >= dilihat.tglMulai && k.tglMulai <= dilihat.tglSelesai)
        .sort((a, b) => a.tglMulai.localeCompare(b.tglMulai)),
    [kalender, dilihat],
  );
  const [y, m] = bulanAktif.split("-").map(Number);
  const hari = hariIni();

  return (
    <>
      <JudulHalaman
        judul="Kalender Akademik"
        sub={`TA ${dilihat?.nama} · tanggal libur otomatis tidak dihitung sebagai hari sekolah`}
        aksi={
          bisaUbah && (
            <Tombol ikon={Plus} onClick={() => setForm({})}>
              Tambah Agenda
            </Tombol>
          )
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Kartu className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold">
              {NAMA_BULAN[m - 1]} {y}
            </h3>
            <Pilihan value={bulanAktif} onChange={(e) => setBulan(e.target.value)} aria-label="Pilih bulan" className="w-48">
              {daftarBulan.map((b) => {
                const [yy, mm] = b.split("-").map(Number);
                return (
                  <option key={b} value={b}>
                    {NAMA_BULAN[mm - 1]} {yy}
                  </option>
                );
              })}
            </Pilihan>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <div key={d} className={cx("pb-1 text-xs font-bold", d === 0 ? "text-coral-tua" : "text-redup")}>
                {HARI_SINGKAT[d]}
              </div>
            ))}
            {sel.map((d, i) => {
              if (!d) return <div key={`k${i}`} />;
              const acara = kalender.filter((k) => k.tglMulai <= d && d <= k.tglSelesai);
              const minggu = dariISO(d).getDay() === 0;
              const libur = acara.find((a) => a.jenis === "libur");
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!bisaUbah}
                  onClick={() => setForm({ tanggal: d })}
                  title={acara.map((a) => a.judul).join(", ") || (bisaUbah ? "Tambah agenda" : undefined)}
                  className={cx(
                    "flex min-h-14 flex-col items-center gap-1 rounded-2xl p-1.5 text-sm font-bold transition sm:min-h-20",
                    libur || minggu ? "bg-coral-lembut text-coral-tua" : "bg-krem/70",
                    d === hari && "ring-2 ring-coral",
                    bisaUbah && "hover:bg-krem-tua",
                  )}
                >
                  {Number(d.slice(8))}
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {acara.map((a) => (
                      <span key={a.id} className={cx("size-2 rounded-full", a.jenis === "libur" ? "bg-coral" : a.jenis === "ujian" ? "bg-langit" : "bg-mustard")} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(JENIS).map(([k, [l, n]]) => (
              <Lencana key={k} nada={n}>
                {l}
              </Lencana>
            ))}
          </div>
        </Kartu>

        <Kartu className="p-5 sm:p-6">
          <h3 className="mb-4 font-display text-lg font-bold">Daftar Agenda</h3>
          {daftar.length === 0 ? (
            <Kosong ikon={CalendarDays} judul="Belum ada agenda" />
          ) : (
            <ul className="flex flex-col gap-2">
              {daftar.map((k) => (
                <li key={k.id} className={cx("flex items-center gap-3 rounded-2xl p-3", k.tglSelesai < hari && "opacity-60")}>
                  <span className={cx("grid size-11 shrink-0 place-items-center rounded-2xl font-display font-bold", JENIS[k.jenis][2])}>
                    {Number(k.tglMulai.slice(8))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{k.judul}</span>
                    <span className="block text-xs text-redup">
                      {formatPendek(k.tglMulai)}
                      {k.tglSelesai !== k.tglMulai && ` – ${formatPendek(k.tglSelesai)}`} · {JENIS[k.jenis][0]}
                    </span>
                  </span>
                  {bisaUbah && (
                    <>
                      <TombolIkon ikon={Pencil} label="Edit" onClick={() => setForm({ data: k })} />
                      <TombolIkon ikon={Trash2} label="Hapus" onClick={() => setAkanHapus(k)} className="hover:text-coral-tua" />
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>

      {form && <FormAgenda awal={form.data} tanggal={form.tanggal} tutup={() => setForm(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul="Hapus agenda?"
        pesan={`“${akanHapus?.judul}” akan dihapus dari kalender.`}
        onYa={() => {
          if (akanHapus) hapus("kalender", akanHapus.id);
          toast("Agenda dihapus.");
        }}
      />
    </>
  );
}

function FormAgenda({ awal, tanggal, tutup }: { awal?: Kalender; tanggal?: string; tutup: () => void }) {
  const toast = useToast();
  const [judul, setJudul] = useState(awal?.judul ?? "");
  const [jenis, setJenis] = useState<Kalender["jenis"]>(awal?.jenis ?? "kegiatan");
  const [mulai, setMulai] = useState(awal?.tglMulai ?? tanggal ?? hariIni());
  const [selesai, setSelesai] = useState(awal?.tglSelesai ?? tanggal ?? hariIni());
  const [galat, setGalat] = useState<{ judul?: string; selesai?: string }>({});

  function simpan() {
    const g = { judul: wajib(judul, "Judul"), selesai: selesai < mulai ? "Tanggal selesai tidak boleh sebelum tanggal mulai." : undefined };
    if (g.judul || g.selesai) {
      setGalat(g);
      return;
    }
    const data = { judul: judul.trim(), jenis, tglMulai: mulai, tglSelesai: selesai };
    if (awal) ubah("kalender", awal.id, data);
    else tambah("kalender", data);
    const adaAbsen = jenis === "libur" && semua("presensi").some((x) => x.tanggal >= mulai && x.tanggal <= selesai);
    toast(
      adaAbsen ? "Agenda disimpan. Catatan: sudah ada absensi pada rentang libur ini dan tetap tersimpan." : awal ? "Agenda diperbarui." : "Agenda ditambahkan.",
      adaAbsen ? "info" : "sukses",
    );
    tutup();
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={awal ? "Edit Agenda" : "Tambah Agenda"}
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
        <Isian label="Judul" wajib galat={galat.judul}>
          {(id) => <Input id={id} value={judul} onChange={(e) => setJudul(e.target.value)} autoFocus />}
        </Isian>
        <Isian label="Jenis" bantuan={jenis === "libur" ? "Tanggal libur tidak bisa diisi absensi." : undefined}>
          {(id) => (
            <Pilihan id={id} value={jenis} onChange={(e) => setJenis(e.target.value as Kalender["jenis"])}>
              <option value="kegiatan">Kegiatan</option>
              <option value="ujian">Ujian / Asesmen</option>
              <option value="libur">Libur</option>
            </Pilihan>
          )}
        </Isian>
        <div className="grid grid-cols-2 gap-3">
          <Isian label="Mulai">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={mulai}
                onChange={(e) => {
                  setMulai(e.target.value);
                  if (selesai < e.target.value) setSelesai(e.target.value);
                }}
              />
            )}
          </Isian>
          <Isian label="Selesai" galat={galat.selesai}>
            {(id) => <Input id={id} type="date" value={selesai} min={mulai} onChange={(e) => setSelesai(e.target.value)} />}
          </Isian>
        </div>
      </div>
    </Modal>
  );
}
