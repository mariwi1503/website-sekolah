"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarX, CheckCheck, ChevronLeft, ChevronRight, Printer, Save, School } from "lucide-react";
import { WARNA_STATUS } from "@/components/grafik";
import { Avatar, cx, Input, JudulHalaman, Kartu, Kosong, Lencana, Pil, Pilihan, Tombol, useToast } from "@/components/ui";
import { GagalSimpanError, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { Rombel, StatusPresensi } from "@/lib/db/types";
import { anggotaDari, hitungPresensi, LABEL_STATUS, useRombelSaya } from "@/lib/data";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { dariISO, formatPanjang, HARI_SINGKAT, hariIni, hariSekolah, NAMA_BULAN, tambahHari, tanggalLibur } from "@/lib/tanggal";

const STATUS: StatusPresensi[] = ["H", "S", "I", "A"];

const GAYA_STATUS: Record<StatusPresensi, { aktif: string; sel: string }> = {
  H: { aktif: "bg-sage text-white", sel: "bg-sage-muda text-sage-tua" },
  S: { aktif: "bg-mustard text-white", sel: "bg-mustard-muda text-mustard-tua" },
  I: { aktif: "bg-langit text-white", sel: "bg-langit-muda text-langit-tua" },
  A: { aktif: "bg-coral text-white", sel: "bg-coral-muda text-coral-tua" },
};

export function IsiPresensi() {
  const p = usePengguna();
  const params = useSearchParams();
  const { dilihat } = useTahunAjaran();
  const rombelSaya = useRombelSaya(p);
  const [tab, setTab] = useState<"harian" | "rekap">("harian");

  // Bawaan: kelas perwalian guru, atau rombel dari tautan dashboard.
  const bawaan =
    rombelSaya.find((r) => r.id === params.get("rombel"))?.id ??
    rombelSaya.find((r) => r.waliKelasGuruId === p?.guruId)?.id ??
    rombelSaya[0]?.id ??
    "";
  const [rombelId, setRombelId] = useState(bawaan);
  const rombel = rombelSaya.find((r) => r.id === rombelId) ?? rombelSaya.find((r) => r.id === bawaan);

  return (
    <>
      <JudulHalaman
        judul="Absensi Siswa"
        sub={`Senin–Sabtu · TA ${dilihat?.nama}`}
        aksi={
          <Pil
            nilai={tab}
            ubah={setTab}
            pilihan={[
              { nilai: "harian", label: "Isi Harian" },
              { nilai: "rekap", label: "Rekap Bulanan" },
            ]}
          />
        }
      />
      {!rombel ? (
        <Kartu>
          <Kosong ikon={School} judul="Belum ada kelas" pesan="Anda belum terhubung dengan kelas mana pun pada tahun ajaran ini." />
        </Kartu>
      ) : (
        <>
          <div className={cx("no-print mb-5 flex-wrap gap-2", rombelSaya.length > 1 ? "flex" : "hidden")}>
            {rombelSaya.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRombelId(r.id)}
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-bold transition",
                  r.id === rombel.id ? "clay-sm bg-coral text-white" : "bg-permukaan/70 text-tinta-2 hover:bg-permukaan",
                )}
              >
                {r.nama}
                {r.waliKelasGuruId === p?.guruId && " ★"}
              </button>
            ))}
          </div>
          {tab === "harian" ? <Harian key={rombel.id} rombel={rombel} /> : <Rekap key={rombel.id} rombel={rombel} />}
        </>
      )}
    </>
  );
}

function Harian({ rombel }: { rombel: Rombel }) {
  const p = usePengguna();
  const toast = useToast();
  const { dilihat, arsip } = useTahunAjaran();
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const siswa = useKoleksi("siswa");
  const presensi = useKoleksi("presensi");
  const kalender = useKoleksi("kalender");

  const batasAkhir = dilihat && hariIni() > dilihat.tglSelesai ? dilihat.tglSelesai : hariIni();
  const [tanggal, setTanggal] = useState(batasAkhir);
  const anggota = useMemo(() => anggotaDari(keanggotaan, rombel.id), [keanggotaan, rombel.id]);
  const tersimpan = presensi.find((x) => x.rombelId === rombel.id && x.tanggal === tanggal);

  const [status, setStatus] = useState<Record<string, StatusPresensi>>(tersimpan?.status ?? {});
  const [ket, setKet] = useState<Record<string, string>>(tersimpan?.keterangan ?? {});
  const [berubah, setBerubah] = useState(false);

  // Muat ulang isian setiap kali tanggal berganti atau data tersimpan berubah.
  const [sumber, setSumber] = useState({ tanggal, tersimpan });
  if (sumber.tanggal !== tanggal || sumber.tersimpan !== tersimpan) {
    setSumber({ tanggal, tersimpan });
    setStatus(tersimpan?.status ?? {});
    setKet(tersimpan?.keterangan ?? {});
    setBerubah(false);
  }

  const bisaUbah = !arsip && (punya(p, "admin") || rombel.waliKelasGuruId === p?.guruId);
  const libur = tanggalLibur(tanggal, kalender);
  const minggu = dariISO(tanggal).getDay() === 0;
  const diLuarTA = !!dilihat && (tanggal < dilihat.tglMulai || tanggal > dilihat.tglSelesai);
  const masaDepan = tanggal > hariIni();
  const bolehIsi = !libur && !minggu && !diLuarTA && !masaDepan;

  const jumlah = useMemo(() => {
    const j: Record<StatusPresensi, number> = { H: 0, S: 0, I: 0, A: 0 };
    anggota.forEach((k) => status[k.id] && j[status[k.id]]++);
    return j;
  }, [anggota, status]);
  const belumDiisi = anggota.filter((k) => !status[k.id]).length;

  function geserHari(n: number) {
    let d = tambahHari(tanggal, n);
    for (let i = 0; i < 14 && !hariSekolah(d, kalender); i++) d = tambahHari(d, n);
    setTanggal(d);
  }

  function simpan() {
    if (belumDiisi > 0) {
      toast(`Masih ada ${belumDiisi} siswa yang belum diberi status.`, "galat");
      return;
    }
    const keterangan = Object.fromEntries(Object.entries(ket).filter(([k, v]) => v.trim() && status[k] !== "H"));
    try {
      const terbaru = semua("presensi").find((x) => x.rombelId === rombel.id && x.tanggal === tanggal);
      if (terbaru) {
        ubah("presensi", terbaru.id, { status, keterangan, dicatatOleh: p!.id });
      } else {
        tambah("presensi", {
          rombelId: rombel.id,
          tanggal,
          semester: dilihat && tanggal.slice(0, 4) > dilihat.tglMulai.slice(0, 4) ? 2 : 1,
          dicatatOleh: p!.id,
          status,
          keterangan,
        });
      }
      setBerubah(false);
      toast(`Absensi Kelas ${rombel.nama} tanggal ${formatPanjang(tanggal)} tersimpan.`);
    } catch (e) {
      toast(e instanceof GagalSimpanError ? e.message : "Gagal menyimpan absensi.", "galat");
    }
  }

  const pencatat = tersimpan ? semua("pengguna").find((u) => u.id === tersimpan.dicatatOleh) : undefined;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Kartu className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-garis/70 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Tombol varian="kedua" ukuran="sm" ikon={ChevronLeft} aria-label="Hari sekolah sebelumnya" onClick={() => geserHari(-1)} />
            <Input
              type="date"
              value={tanggal}
              min={dilihat?.tglMulai}
              max={batasAkhir}
              onChange={(e) => e.target.value && setTanggal(e.target.value)}
              className="w-44"
              aria-label="Tanggal absensi"
            />
            <Tombol
              varian="kedua"
              ukuran="sm"
              ikon={ChevronRight}
              aria-label="Hari sekolah berikutnya"
              onClick={() => geserHari(1)}
              disabled={tambahHari(tanggal, 1) > batasAkhir}
            />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold">{formatPanjang(tanggal)}</p>
            <p className="text-xs text-redup">
              {tersimpan
                ? `Tersimpan · dicatat oleh ${pencatat?.nama.split(",")[0] ?? "-"}`
                : bolehIsi
                  ? "Belum diisi"
                  : ""}
              {berubah && <span className="font-bold text-coral-tua"> · ada perubahan belum disimpan</span>}
            </p>
          </div>
          {bisaUbah && bolehIsi && (
            <Tombol
              varian="sage"
              ukuran="sm"
              ikon={CheckCheck}
              onClick={() => {
                setStatus(Object.fromEntries(anggota.map((k) => [k.id, status[k.id] ?? "H"])));
                setBerubah(true);
              }}
            >
              Sisanya Hadir
            </Tombol>
          )}
        </div>

        {!bolehIsi ? (
          <Kosong
            ikon={CalendarX}
            judul={libur ? `Libur: ${libur.judul}` : minggu ? "Hari Minggu" : masaDepan ? "Tanggal belum tiba" : "Di luar tahun ajaran"}
            pesan="Absensi hanya bisa diisi pada hari sekolah (Senin–Sabtu) yang bukan hari libur."
          />
        ) : anggota.length === 0 ? (
          <Kosong ikon={School} judul="Kelas belum memiliki siswa" />
        ) : (
          <ul className="divide-y divide-garis/70">
            {anggota.map((k) => {
              const s = siswa.find((x) => x.id === k.siswaId);
              const st = status[k.id];
              return (
                <li key={k.id} className="px-4 py-2.5 sm:px-5">
                  {/* Satu baris per siswa: nama + tombol status, agar mudah di HP. */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-6 shrink-0 text-right text-sm font-bold text-redup">{k.noAbsen}</span>
                    <span className="hidden sm:block">
                      <Avatar nama={s?.nama ?? "?"} ukuran={34} />
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-sm leading-tight font-bold sm:truncate">{s?.nama}</span>
                    {st && st !== "H" && (
                      <KolomKeterangan
                        className="hidden w-44 sm:block"
                        nilai={ket[k.id] ?? ""}
                        nonaktif={!bisaUbah}
                        ubah={(v) => {
                          setKet({ ...ket, [k.id]: v });
                          setBerubah(true);
                        }}
                      />
                    )}
                    <div className="flex shrink-0 gap-1.5">
                      {STATUS.map((x) => (
                        <button
                          key={x}
                          type="button"
                          disabled={!bisaUbah}
                          title={LABEL_STATUS[x]}
                          aria-label={`${s?.nama}: ${LABEL_STATUS[x]}`}
                          aria-pressed={st === x}
                          onClick={() => {
                            setStatus({ ...status, [k.id]: x });
                            setBerubah(true);
                          }}
                          className={cx(
                            "size-11 rounded-xl text-sm font-bold transition disabled:cursor-default sm:size-10",
                            st === x ? cx("clay-sm", GAYA_STATUS[x].aktif) : "bg-krem text-redup hover:bg-krem-tua",
                          )}
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  </div>
                  {st && st !== "H" && (
                    <KolomKeterangan
                      className="mt-2 ml-8 w-[calc(100%-2rem)] sm:hidden"
                      nilai={ket[k.id] ?? ""}
                      nonaktif={!bisaUbah}
                      ubah={(v) => {
                        setKet({ ...ket, [k.id]: v });
                        setBerubah(true);
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Kartu>

      {/* Layar kecil: ringkasan + tombol Simpan menempel di bawah layar. */}
      {bisaUbah && bolehIsi && anggota.length > 0 && (
        <>
          <div className="h-20 xl:hidden" />
          <div className="clay fixed inset-x-3 bottom-[5.75rem] z-20 flex items-center gap-3 px-4 py-3 lg:right-6 lg:bottom-4 lg:left-[338px] xl:hidden">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {STATUS.map((x) => (
                <span key={x} className={cx("rounded-full px-2.5 py-1 text-xs font-bold", GAYA_STATUS[x].sel)}>
                  {x} {jumlah[x]}
                </span>
              ))}
              {belumDiisi > 0 && <span className="px-1 py-1 text-xs font-bold text-coral-tua">{belumDiisi} belum</span>}
            </div>
            <Tombol ikon={Save} onClick={simpan} disabled={!berubah && !!tersimpan} className="shrink-0">
              Simpan
            </Tombol>
          </div>
        </>
      )}
      {!bisaUbah && (
        <p className="rounded-2xl bg-krem-tua/60 p-3 text-xs text-tinta-2 xl:hidden">
          {arsip ? "Tahun ajaran ini sudah diarsipkan." : "Hanya wali kelas dan operator yang dapat mengisi absensi kelas ini."}
        </p>
      )}

      <div className="hidden flex-col gap-5 xl:flex">
        <Kartu className="p-5 xl:sticky xl:top-6">
          <h3 className="mb-4 font-bold">Ringkasan</h3>
          <div className="grid grid-cols-2 gap-3">
            {STATUS.map((x) => (
              <div key={x} className={cx("rounded-2xl p-3", GAYA_STATUS[x].sel)}>
                <p className="font-display text-2xl font-bold">{jumlah[x]}</p>
                <p className="text-xs font-bold">{LABEL_STATUS[x]}</p>
              </div>
            ))}
          </div>
          {bolehIsi && belumDiisi > 0 && <p className="mt-3 text-sm font-semibold text-coral-tua">{belumDiisi} siswa belum diberi status.</p>}
          {bisaUbah && bolehIsi && anggota.length > 0 && (
            <Tombol ikon={Save} className="mt-4 w-full" onClick={simpan} disabled={!berubah && !!tersimpan}>
              {tersimpan ? "Simpan Perubahan" : "Simpan Absensi"}
            </Tombol>
          )}
          {!bisaUbah && (
            <p className="mt-4 rounded-2xl bg-krem p-3 text-xs text-tinta-2">
              {arsip ? "Tahun ajaran ini sudah diarsipkan." : "Hanya wali kelas dan operator yang dapat mengisi absensi kelas ini."}
            </p>
          )}
        </Kartu>
      </div>
    </div>
  );
}

function Rekap({ rombel }: { rombel: Rombel }) {
  const { dilihat } = useTahunAjaran();
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const siswa = useKoleksi("siswa");
  const presensi = useKoleksi("presensi");
  const kalender = useKoleksi("kalender");
  const guru = useKoleksi("guru");

  const bulanDaftar = useMemo(() => {
    if (!dilihat) return [];
    const hasil: string[] = [];
    const akhir = hariIni() < dilihat.tglSelesai ? hariIni() : dilihat.tglSelesai;
    for (let d = dilihat.tglMulai.slice(0, 7); d <= akhir.slice(0, 7); ) {
      hasil.push(d);
      const [y, m] = d.split("-").map(Number);
      d = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    }
    return hasil;
  }, [dilihat]);
  const [bulan, setBulan] = useState(bulanDaftar.at(-1) ?? hariIni().slice(0, 7));

  const hari = useMemo(() => {
    const [y, m] = bulan.split("-").map(Number);
    const jumlah = new Date(y, m, 0).getDate();
    return Array.from({ length: jumlah }, (_, i) => `${bulan}-${String(i + 1).padStart(2, "0")}`).filter((d) => hariSekolah(d, kalender));
  }, [bulan, kalender]);

  const anggota = useMemo(() => anggotaDari(keanggotaan, rombel.id), [keanggotaan, rombel.id]);
  const presBulan = useMemo(() => {
    const m = new Map<string, (typeof presensi)[number]>();
    presensi.filter((x) => x.rombelId === rombel.id && x.tanggal.startsWith(bulan)).forEach((x) => m.set(x.tanggal, x));
    return m;
  }, [presensi, rombel.id, bulan]);
  const rekapKelas = hitungPresensi([...presBulan.values()]);
  const [y, m] = bulan.split("-").map(Number);

  return (
    <Kartu className="overflow-hidden">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">
            Rekap Kelas {rombel.nama} — {NAMA_BULAN[m - 1]} {y}
          </h3>
          <p className="text-sm text-redup">
            Wali kelas: {guru.find((g) => g.id === rombel.waliKelasGuruId)?.nama ?? "-"} · {presBulan.size} dari {hari.length} hari sekolah tercatat ·
            Kehadiran {rekapKelas.total ? Math.round(rekapKelas.persenHadir) : 0}%
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Pilihan value={bulan} onChange={(e) => setBulan(e.target.value)} aria-label="Bulan" className="w-48">
            {bulanDaftar.map((b) => {
              const [yy, mm] = b.split("-").map(Number);
              return (
                <option key={b} value={b}>
                  {NAMA_BULAN[mm - 1]} {yy}
                </option>
              );
            })}
          </Pilihan>
          <Tombol varian="kedua" ikon={Printer} onClick={() => window.print()}>
            Cetak
          </Tombol>
        </div>
      </div>
      <div className="scroll-tipis overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-redup">
              <th className="sticky left-0 bg-permukaan px-3 py-2 pl-5 text-left">No</th>
              <th className="sticky left-10 bg-permukaan px-3 py-2 text-left">Nama</th>
              {hari.map((d) => (
                <th key={d} className="px-0.5 py-2 text-center font-bold">
                  <span className="block">{HARI_SINGKAT[dariISO(d).getDay()][0]}</span>
                  {Number(d.slice(8))}
                </th>
              ))}
              {STATUS.map((s) => (
                <th key={s} className="px-2 py-2 text-center">
                  {s}
                </th>
              ))}
              <th className="px-3 py-2 pr-5 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {anggota.map((k) => {
              const s = siswa.find((x) => x.id === k.siswaId);
              const j: Record<StatusPresensi, number> = { H: 0, S: 0, I: 0, A: 0 };
              return (
                <tr key={k.id} className="border-t border-garis/70">
                  <td className="sticky left-0 bg-permukaan px-3 py-1.5 pl-5 text-redup">{k.noAbsen}</td>
                  <td className="sticky left-10 max-w-48 truncate bg-permukaan px-3 py-1.5 font-bold">{s?.nama}</td>
                  {hari.map((d) => {
                    const st = presBulan.get(d)?.status[k.id];
                    if (st) j[st]++;
                    return (
                      <td key={d} className="px-0.5 py-1.5 text-center">
                        <span
                          className="mx-auto grid size-5 place-items-center rounded-md text-[10px] font-bold"
                          style={st ? { background: st === "H" ? "var(--color-sage-muda)" : WARNA_STATUS[st], color: st === "H" ? "var(--color-sage-tua)" : "white" } : { background: "var(--color-krem)" }}
                          title={st ? LABEL_STATUS[st] : "Belum diisi"}
                        >
                          {st === "H" ? "•" : st ?? ""}
                        </span>
                      </td>
                    );
                  })}
                  {STATUS.map((x) => (
                    <td key={x} className="px-2 py-1.5 text-center font-bold">
                      {j[x]}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 pr-5 text-center font-bold">
                    {j.H + j.S + j.I + j.A ? Math.round((j.H / (j.H + j.S + j.I + j.A)) * 100) : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 p-5 text-xs">
        {STATUS.map((s) => (
          <Lencana key={s} nada={s === "H" ? "sage" : s === "S" ? "mustard" : s === "I" ? "langit" : "coral"}>
            {s} = {LABEL_STATUS[s]}
          </Lencana>
        ))}
      </div>
    </Kartu>
  );
}

function KolomKeterangan({
  nilai,
  ubah,
  nonaktif,
  className,
}: {
  nilai: string;
  ubah: (v: string) => void;
  nonaktif: boolean;
  className?: string;
}) {
  return (
    <input
      value={nilai}
      disabled={nonaktif}
      onChange={(e) => ubah(e.target.value)}
      placeholder="Keterangan (opsional)…"
      aria-label="Keterangan"
      className={cx("cekung h-10 rounded-full px-3 text-sm outline-none sm:h-9 sm:text-xs", className)}
    />
  );
}
