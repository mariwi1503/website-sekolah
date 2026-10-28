"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarCheck, CalendarDays, CircleCheck, Clock, GraduationCap, Megaphone, NotebookPen, Play, School, Sun, type LucideIcon } from "lucide-react";
import { Donat, GrafikBatang, WARNA_STATUS } from "@/components/grafik";
import { Avatar, IkonBulat, JudulHalaman, Kartu, Lencana, Tombol, type Nada } from "@/components/ui";
import { useKoleksi } from "@/lib/db/store";
import { hitungPresensi, LABEL_STATUS, pengumumanUntuk, useRombelSaya } from "@/lib/data";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { dariISO, formatPanjang, formatPendek, HARI_SINGKAT, hariIni, hariSekolah, tambahHari } from "@/lib/tanggal";

function KartuStat({ ikon, nada, label, nilai, ket, href }: { ikon: LucideIcon; nada: Nada; label: string; nilai: string; ket: string; href: string }) {
  return (
    <Link href={href} className="block transition hover:-translate-y-1">
      <Kartu nada={nada} className="h-full p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:block">
          <span className="sm:hidden">
            <IkonBulat ikon={ikon} nada={nada} ukuran="sm" />
          </span>
          <span className="hidden sm:block">
            <IkonBulat ikon={ikon} nada={nada} />
          </span>
          <p className="text-[13px] leading-tight font-bold text-tinta-2 sm:mt-4 sm:text-sm">{label}</p>
        </div>
        <p className="mt-2 font-display text-3xl font-bold sm:mt-0 sm:text-4xl">{nilai}</p>
        <p className="mt-0.5 text-[11px] leading-snug font-bold text-sage-tua sm:mt-1 sm:text-xs">{ket}</p>
      </Kartu>
    </Link>
  );
}

export function IsiDashboard() {
  const p = usePengguna();
  const { dilihat, arsip } = useTahunAjaran();
  const rombelSaya = useRombelSaya(p);
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const presensi = useKoleksi("presensi");
  const jurnal = useKoleksi("jurnal");
  const pengampu = useKoleksi("pengampu");
  const pengumuman = useKoleksi("pengumuman");
  const kalender = useKoleksi("kalender");
  const siswa = useKoleksi("siswa");

  const hari = hariIni();
  const pimpinan = punya(p, "admin", "kepsek");
  const rombelWali = rombelSaya.filter((r) => r.waliKelasGuruId === p?.guruId);
  const idRombel = useMemo(() => new Set(rombelSaya.map((r) => r.id)), [rombelSaya]);

  const data = useMemo(() => {
    const anggota = keanggotaan.filter((k) => idRombel.has(k.rombelId));
    const pres = presensi.filter((x) => idRombel.has(x.rombelId));

    // Minggu berjalan: Senin–Sabtu.
    const dow = dariISO(hari).getDay();
    const senin = tambahHari(hari, dow === 0 ? -6 : 1 - dow);
    const minggu = Array.from({ length: 6 }, (_, i) => tambahHari(senin, i));
    const presMinggu = pres.filter((x) => x.tanggal >= senin && x.tanggal <= minggu[5]);
    const batang = minggu.map((d) => {
      const r = hitungPresensi(presMinggu.filter((x) => x.tanggal === d));
      return {
        label: HARI_SINGKAT[dariISO(d).getDay()],
        nilai: r.total ? r.persenHadir : null,
        sub: formatPanjang(d),
        sorot: d === hari,
      };
    });

    const presHariIni = pres.filter((x) => x.tanggal === hari);
    const sudahAbsen = new Set(presHariIni.map((x) => x.rombelId));
    const pengampuSaya = pengampu.filter((x) => (pimpinan ? idRombel.has(x.rombelId) : x.guruId === p?.guruId));
    const idPengampu = new Set(pengampuSaya.map((x) => x.id));
    const jurnalMinggu = jurnal.filter((j) => idPengampu.has(j.pengampuId) && j.tanggal >= senin);

    return {
      anggota,
      batang,
      rekapMinggu: hitungPresensi(presMinggu),
      rekapHariIni: hitungPresensi(presHariIni),
      sudahAbsen,
      jurnalMinggu,
      menungguPeriksa: jurnal.filter((j) => idPengampu.has(j.pengampuId) && j.status === "dikirim").length,
    };
  }, [keanggotaan, presensi, jurnal, pengampu, idRombel, hari, pimpinan, p]);

  const pengumumanTerbaru = useMemo(
    () =>
      pengumumanUntuk(
        pengumuman,
        p,
        [],
        rombelSaya.map((r) => r.id),
      ).slice(0, 3),
    [pengumuman, p, rombelSaya],
  );
  const agenda = useMemo(
    () =>
      kalender
        .filter((k) => k.tglSelesai >= hari)
        .sort((a, b) => a.tglMulai.localeCompare(b.tglMulai))
        .slice(0, 4),
    [kalender, hari],
  );

  // Siswa wali kelas yang tidak hadir minggu ini.
  const tidakHadir = useMemo(() => {
    if (rombelWali.length === 0) return [];
    const ids = new Set(rombelWali.map((r) => r.id));
    const hitung = new Map<string, { S: number; I: number; A: number }>();
    for (const x of presensi) {
      if (!ids.has(x.rombelId) || x.tanggal < tambahHari(hari, -13)) continue;
      for (const [kk, st] of Object.entries(x.status)) {
        if (st === "H") continue;
        const h = hitung.get(kk) ?? { S: 0, I: 0, A: 0 };
        h[st]++;
        hitung.set(kk, h);
      }
    }
    return [...hitung.entries()]
      .map(([kk, h]) => {
        const k = keanggotaan.find((x) => x.id === kk);
        return { kk, nama: siswa.find((s) => s.id === k?.siswaId)?.nama ?? "-", ...h, total: h.S + h.I + h.A };
      })
      .sort((a, b) => b.A - a.A || b.total - a.total)
      .slice(0, 5);
  }, [rombelWali, presensi, keanggotaan, siswa, hari]);

  const sekolahHariIni = hariSekolah(hari, kalender);
  const waliBelumAbsen = rombelWali.filter((r) => !data.sudahAbsen.has(r.id));

  const cta = pimpinan ? (
    <>
      <Link href="/dashboard/presensi">
        <Tombol ikon={CalendarCheck}>Lihat Rekap Absensi</Tombol>
      </Link>
      {/* Di HP sudah ada di navigasi bawah. */}
      <Link href="/dashboard/pengumuman" className="hidden sm:block">
        <Tombol varian="kedua" ikon={Megaphone}>
          Buat Pengumuman
        </Tombol>
      </Link>
    </>
  ) : (
    <>
      <Link href="/dashboard/presensi">
        <Tombol ikon={Play}>{rombelWali.length ? "Mulai Absensi Kelas" : "Lihat Absensi"}</Tombol>
      </Link>
      <Link href="/dashboard/kelas" className="hidden sm:block">
        <Tombol varian="kedua" ikon={School}>
          Kelas Saya
        </Tombol>
      </Link>
    </>
  );

  // Kartu yang paling perlu dilihat; di HP dinaikkan ke atas grafik.
  const kartuUtama = pimpinan ? (
    <Kartu className="p-6">
      <h3 className="mb-4 text-lg font-bold">Absensi Hari Ini per Kelas</h3>
      {!sekolahHariIni ? (
        <p className="text-sm text-redup">Hari ini bukan hari sekolah.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {rombelSaya.map((r) => {
            const ok = data.sudahAbsen.has(r.id);
            return (
              <Link
                key={r.id}
                href={`/dashboard/presensi?rombel=${r.id}`}
                className={`clay-sm flex flex-col items-center gap-1 py-3 text-sm font-bold ${ok ? "bg-sage-lembut text-sage-tua" : "bg-coral-lembut text-coral-tua"}`}
              >
                {ok ? <CircleCheck size={18} /> : <Clock size={18} />}
                {r.nama}
              </Link>
            );
          })}
        </div>
      )}
    </Kartu>
  ) : (
    <Kartu className="p-6">
      <h3 className="mb-1 text-lg font-bold">Perlu Perhatian</h3>
      <p className="mb-4 text-sm text-redup">Siswa kelas Anda yang paling sering tidak hadir (2 minggu terakhir)</p>
      {rombelWali.length === 0 ? (
        <p className="text-sm text-redup">Anda tidak menjadi wali kelas pada tahun ajaran ini.</p>
      ) : tidakHadir.length === 0 ? (
        <p className="text-sm text-redup">Semua siswa hadir. 🎉</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tidakHadir.map((t) => (
            <li key={t.kk} className="flex items-center gap-3">
              <Avatar nama={t.nama} ukuran={34} />
              <span className="flex-1 truncate text-sm font-bold">{t.nama}</span>
              {t.S > 0 && <Lencana nada="mustard">S {t.S}</Lencana>}
              {t.I > 0 && <Lencana nada="langit">I {t.I}</Lencana>}
              {t.A > 0 && <Lencana nada="coral">A {t.A}</Lencana>}
            </li>
          ))}
        </ul>
      )}
    </Kartu>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* -mb-6 menetralkan gap kolom karena JudulHalaman sudah punya margin bawah sendiri. */}
      <div className="-mb-6">
        <JudulHalaman judul="Dashboard" lencana={<Lencana nada="mustard">PROTOTIPE</Lencana>} />
      </div>

      {/* Ringkasan hari ini. Sapaan dan foto profil sudah tampil di sidebar. */}
      <Kartu nada="coral" className="px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-coral-tua">
              <Sun size={15} /> {formatPanjang(hari)} · Semester {dilihat?.semesterAktif === 1 ? "Ganjil" : "Genap"}
              {arsip ? ` · Arsip TA ${dilihat?.nama}` : ""}
            </p>
            <p className="mt-0.5 font-display text-lg leading-snug font-bold">
              {!sekolahHariIni
                ? "Hari ini tidak ada kegiatan belajar."
                : pimpinan
                  ? `${data.sudahAbsen.size} dari ${rombelSaya.length} kelas sudah mengisi absensi hari ini.`
                  : waliBelumAbsen.length
                    ? `Absensi Kelas ${waliBelumAbsen.map((r) => r.nama).join(", ")} belum diisi hari ini.`
                    : rombelWali.length
                      ? "Absensi kelas Anda hari ini sudah lengkap. Terima kasih!"
                      : "Semoga kegiatan mengajar hari ini menyenangkan."}
            </p>
          </div>
          {!arsip && <div className="flex shrink-0 flex-wrap gap-3">{cta}</div>}
        </div>
      </Kartu>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <KartuStat
          ikon={GraduationCap}
          nada="sage"
          label={pimpinan ? "Total Siswa" : "Siswa Diampu"}
          nilai={String(data.anggota.length)}
          ket="Siswa terdaftar tahun ini"
          href="/dashboard/siswa"
        />
        <KartuStat
          ikon={School}
          nada="coral"
          label={pimpinan ? "Data Kelas" : "Kelas Diampu"}
          nilai={String(rombelSaya.length)}
          ket="Rombongan belajar"
          href="/dashboard/kelas"
        />
        <KartuStat
          ikon={Clock}
          nada="mustard"
          label="Kehadiran Minggu Ini"
          nilai={data.rekapMinggu.total ? `${Math.round(data.rekapMinggu.persenHadir)}%` : "–"}
          ket={`Hari ini: ${data.rekapHariIni.total ? `${Math.round(data.rekapHariIni.persenHadir)}% hadir` : "belum ada data"}`}
          href="/dashboard/presensi"
        />
        <KartuStat
          ikon={NotebookPen}
          nada="langit"
          label="Jurnal Mengajar"
          nilai={String(data.jurnalMinggu.length)}
          ket={punya(p, "kepsek") ? `${data.menungguPeriksa} menunggu diperiksa` : "Pertemuan minggu ini"}
          href="/dashboard/jurnal"
        />
      </div>

      <div className="lg:hidden">{kartuUtama}</div>

      {/* Grafik */}
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Kartu className="p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Grafik Kehadiran</h3>
              <p className="text-sm text-redup">Persentase siswa hadir per hari, Senin–Sabtu</p>
            </div>
            <Lencana>Minggu ini</Lencana>
          </div>
          <GrafikBatang data={data.batang} />
        </Kartu>

        <Kartu className="p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Komposisi Kehadiran</h3>
              <p className="text-sm text-redup">Akumulasi Hadir, Sakit, Izin, dan Alfa minggu ini</p>
            </div>
            <Link href="/dashboard/presensi" className="clay-sm bg-permukaan px-3 py-1 text-xs font-bold">
              Detail
            </Link>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Donat
              tengah={data.rekapMinggu.total ? `${Math.round(data.rekapMinggu.persenHadir)}%` : "–"}
              subTengah="Hadir"
              bagian={(["H", "S", "I", "A"] as const).map((s) => ({ label: s, nilai: data.rekapMinggu[s], warna: WARNA_STATUS[s] }))}
            />
            <ul className="flex w-full flex-col gap-3">
              {(["H", "S", "I", "A"] as const).map((s) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="size-3.5 rounded-full" style={{ background: WARNA_STATUS[s] }} />
                  <span className="flex-1 font-bold">
                    {LABEL_STATUS[s]} ({s})
                  </span>
                  <span className="font-bold text-tinta-2">
                    {data.rekapMinggu.total ? Math.round((data.rekapMinggu[s] / data.rekapMinggu.total) * 100) : 0}% ({data.rekapMinggu[s]})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Kartu>
      </div>

      {/* Bawah */}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div className="hidden lg:block">{kartuUtama}</div>
        <Kartu className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Pengumuman Terbaru</h3>
            <Link href="/dashboard/pengumuman" className="text-sm font-bold text-coral-tua">
              Semua
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {pengumumanTerbaru.map((x) => (
              <li key={x.id} className="rounded-2xl bg-krem/80 p-3">
                <p className="text-sm font-bold">{x.judul}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-tinta-2">{x.isi}</p>
                <p className="mt-1 text-[11px] font-semibold text-redup">{formatPendek(x.tanggal)}</p>
              </li>
            ))}
            {pengumumanTerbaru.length === 0 && <p className="text-sm text-redup">Belum ada pengumuman.</p>}
          </ul>
        </Kartu>

        <Kartu className="p-6 lg:col-span-2 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Agenda Sekolah</h3>
            <Link href="/dashboard/kalender" className="text-sm font-bold text-coral-tua">
              Kalender
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {agenda.map((k) => {
              const d = dariISO(k.tglMulai);
              return (
                <li key={k.id} className="flex items-center gap-3">
                  <span
                    className={`clay-sm flex size-12 shrink-0 flex-col items-center justify-center leading-none ${k.jenis === "libur" ? "bg-coral-muda" : k.jenis === "ujian" ? "bg-langit-muda" : "bg-mustard-muda"}`}
                  >
                    <span className="font-display text-lg font-bold">{d.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase">{formatPendek(k.tglMulai).split(" ")[1]}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{k.judul}</span>
                    <span className="block text-xs text-redup capitalize">
                      {k.jenis}
                      {k.tglSelesai !== k.tglMulai && ` · s.d. ${formatPendek(k.tglSelesai)}`}
                    </span>
                  </span>
                </li>
              );
            })}
            {agenda.length === 0 && (
              <li className="flex items-center gap-2 text-sm text-redup">
                <CalendarDays size={16} /> Tidak ada agenda mendatang.
              </li>
            )}
          </ul>
        </Kartu>
      </div>
    </div>
  );
}
