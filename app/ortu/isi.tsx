"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, House, LogOut, Megaphone, MessageCircle, Pin, UserRound } from "lucide-react";
import { Donat, WARNA_STATUS } from "@/components/grafik";
import { LogoLengkap } from "@/components/logo";
import { Avatar, cx, Input, Isian, Kartu, Lencana, Tombol, useToast } from "@/components/ui";
import { ubah, useKoleksi } from "@/lib/db/store";
import type { StatusPresensi } from "@/lib/db/types";
import { hitungPresensi, LABEL_STATUS, pengumumanUntuk } from "@/lib/data";
import { keluar, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { formatPanjang, formatPendek, hariIni, hariSekolah, NAMA_BULAN } from "@/lib/tanggal";

type Tab = "beranda" | "kehadiran" | "info" | "akun";

const GAYA: Record<StatusPresensi, string> = {
  H: "bg-sage-muda text-sage-tua",
  S: "bg-mustard-muda text-mustard-tua",
  I: "bg-langit-muda text-langit-tua",
  A: "bg-coral-muda text-coral-tua",
};

export function PortalOrtu() {
  const p = usePengguna();
  const { aktif } = useTahunAjaran();
  const ortu = useKoleksi("ortu").find((o) => o.id === p?.ortuId);
  const siswa = useKoleksi("siswa");
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const rombel = useKoleksi("rombel");
  const guru = useKoleksi("guru");
  const presensi = useKoleksi("presensi");
  const kalender = useKoleksi("kalender");
  const pengumuman = useKoleksi("pengumuman");
  const [tab, setTab] = useState<Tab>("beranda");
  const [anakId, setAnakId] = useState<string | null>(null);

  const anak = useMemo(
    () =>
      (ortu?.siswaIds ?? [])
        .map((id) => {
          const s = siswa.find((x) => x.id === id);
          const kk = keanggotaan.find((k) => k.siswaId === id && k.tahunAjaranId === aktif?.id);
          const r = rombel.find((x) => x.id === kk?.rombelId);
          return s ? { s, kk, r, wali: guru.find((g) => g.id === r?.waliKelasGuruId) } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [ortu, siswa, keanggotaan, rombel, guru, aktif],
  );
  const dipilih = anak.find((a) => a.s.id === anakId) ?? anak[0];
  const hari = hariIni();

  const catatan = useMemo(() => {
    if (!dipilih?.kk) return [];
    return presensi
      .filter((x) => x.rombelId === dipilih.kk!.rombelId && x.status[dipilih.kk!.id])
      .map((x) => ({ tanggal: x.tanggal, st: x.status[dipilih.kk!.id], ket: x.keterangan[dipilih.kk!.id] }))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [presensi, dipilih]);

  const bulanIni = hari.slice(0, 7);
  const rekapBulan = hitungPresensi(catatan.filter((c) => c.tanggal.startsWith(bulanIni)).map((c) => ({ status: { x: c.st } })));
  const rekapTahun = hitungPresensi(catatan.map((c) => ({ status: { x: c.st } })));
  const hariIniCatatan = catatan.find((c) => c.tanggal === hari);

  const info = useMemo(
    () => pengumumanUntuk(pengumuman, p, anak.map((a) => a.r?.id ?? "").filter(Boolean)),
    [pengumuman, p, anak],
  );
  const agenda = kalender.filter((k) => k.tglSelesai >= hari).sort((a, b) => a.tglMulai.localeCompare(b.tglMulai)).slice(0, 4);

  const waLink = (hp?: string) => (hp ? `https://wa.me/${hp.replace(/^0/, "62").replace(/\D/g, "")}` : undefined);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-4 pb-32">
      <header className="mb-5 flex items-center justify-between">
        <LogoLengkap kecil />
        <button type="button" onClick={keluar} aria-label="Keluar" className="clay-sm grid size-10 place-items-center rounded-full bg-permukaan">
          <LogOut size={18} />
        </button>
      </header>

      <p className="text-sm text-redup">Assalamu’alaikum,</p>
      <h1 className="mb-4 text-2xl font-bold">{ortu?.nama ?? p?.nama}</h1>

      {anak.length > 1 && (
        <div className="scroll-tipis -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {anak.map((a) => (
            <button
              key={a.s.id}
              type="button"
              onClick={() => setAnakId(a.s.id)}
              className={cx(
                "flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-sm font-bold",
                a.s.id === dipilih?.s.id ? "clay-sm bg-coral text-white" : "bg-permukaan text-tinta-2",
              )}
            >
              <Avatar nama={a.s.nama} ukuran={28} />
              {a.s.nama.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {!dipilih ? (
        <Kartu className="p-6 text-center text-sm text-redup">Belum ada data anak yang terhubung dengan akun ini. Hubungi operator sekolah.</Kartu>
      ) : (
        <>
          {tab === "beranda" && (
            <div className="flex flex-col gap-4">
              <Kartu nada="coral" className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar nama={dipilih.s.nama} ukuran={56} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">{dipilih.s.nama}</p>
                    <p className="text-sm text-tinta-2">{dipilih.r ? `Kelas ${dipilih.r.nama} · TA ${aktif?.nama}` : `Status: ${dipilih.s.status}`}</p>
                  </div>
                </div>
                {dipilih.wali && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-permukaan/80 p-3">
                    <Avatar nama={dipilih.wali.nama} ukuran={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-redup">Wali kelas</p>
                      <p className="truncate text-sm font-bold">{dipilih.wali.nama}</p>
                    </div>
                    {waLink(dipilih.wali.hp) && (
                      <a href={waLink(dipilih.wali.hp)} target="_blank" rel="noreferrer" aria-label="Hubungi lewat WhatsApp">
                        <Tombol varian="sage" ukuran="sm" ikon={MessageCircle}>
                          WA
                        </Tombol>
                      </a>
                    )}
                  </div>
                )}
              </Kartu>

              <Kartu className="p-5">
                <p className="text-xs font-bold text-redup">Kehadiran hari ini</p>
                <p className="mb-3 text-sm font-semibold">{formatPanjang(hari)}</p>
                {!hariSekolah(hari, kalender) ? (
                  <Lencana nada="coral">Tidak ada kegiatan belajar</Lencana>
                ) : hariIniCatatan ? (
                  <div className={cx("rounded-2xl p-3 font-bold", GAYA[hariIniCatatan.st])}>
                    {LABEL_STATUS[hariIniCatatan.st]}
                    {hariIniCatatan.ket && <span className="font-normal"> — {hariIniCatatan.ket}</span>}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-krem p-3 text-sm text-tinta-2">Absensi belum diisi oleh wali kelas.</p>
                )}
              </Kartu>

              <Kartu className="flex items-center gap-4 p-5">
                <Donat
                  tengah={rekapBulan.total ? `${Math.round(rekapBulan.persenHadir)}%` : "–"}
                  subTengah="Hadir"
                  bagian={(["H", "S", "I", "A"] as const).map((s) => ({ label: s, nilai: rekapBulan[s], warna: WARNA_STATUS[s] }))}
                />
                <div className="flex-1">
                  <p className="mb-2 font-display font-bold">{NAMA_BULAN[Number(bulanIni.slice(5)) - 1]}</p>
                  {(["H", "S", "I", "A"] as const).map((s) => (
                    <p key={s} className="flex justify-between text-sm">
                      <span className="text-tinta-2">{LABEL_STATUS[s]}</span>
                      <b>{rekapBulan[s]} hari</b>
                    </p>
                  ))}
                </div>
              </Kartu>

              {info[0] && (
                <Kartu nada={info[0].disematkan ? "mustard" : undefined} className="p-5">
                  <p className="mb-1 flex items-center gap-1 text-xs font-bold text-redup">
                    {info[0].disematkan ? <Pin size={12} /> : <Megaphone size={12} />} Pengumuman terbaru
                  </p>
                  <p className="font-bold">{info[0].judul}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-tinta-2">{info[0].isi}</p>
                  <button type="button" onClick={() => setTab("info")} className="mt-2 text-sm font-bold text-coral-tua">
                    Lihat semua
                  </button>
                </Kartu>
              )}
            </div>
          )}

          {tab === "kehadiran" && (
            <div className="flex flex-col gap-4">
              <Kartu className="p-5">
                <p className="font-display font-bold">Rekap TA {aktif?.nama}</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {(["H", "S", "I", "A"] as const).map((s) => (
                    <div key={s} className={cx("rounded-2xl py-2", GAYA[s])}>
                      <p className="font-display text-xl font-bold">{rekapTahun[s]}</p>
                      <p className="text-[11px] font-bold">{LABEL_STATUS[s]}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-tinta-2">
                  Persentase kehadiran: <b>{rekapTahun.total ? Math.round(rekapTahun.persenHadir) : 0}%</b>
                </p>
              </Kartu>
              <Kartu className="p-5">
                <p className="mb-3 font-display font-bold">Riwayat absensi</p>
                <ul className="flex flex-col gap-2">
                  {catatan.slice(0, 40).map((c) => (
                    <li key={c.tanggal} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-redup">{formatPendek(c.tanggal)}</span>
                      <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-bold", GAYA[c.st])}>{LABEL_STATUS[c.st]}</span>
                      <span className="truncate text-xs text-tinta-2">{c.ket}</span>
                    </li>
                  ))}
                  {catatan.length === 0 && <p className="text-sm text-redup">Belum ada catatan absensi.</p>}
                </ul>
              </Kartu>
            </div>
          )}

          {tab === "info" && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-bold">Pengumuman</h2>
              {info.map((x) => (
                <Kartu key={x.id} nada={x.disematkan ? "mustard" : undefined} className="p-5">
                  <p className="text-xs font-semibold text-redup">{formatPendek(x.tanggal)}</p>
                  <p className="font-bold">{x.judul}</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-tinta-2">{x.isi}</p>
                </Kartu>
              ))}
              {info.length === 0 && <p className="text-sm text-redup">Belum ada pengumuman.</p>}
              <h2 className="mt-2 font-display text-lg font-bold">Agenda sekolah</h2>
              <Kartu className="p-5">
                <ul className="flex flex-col gap-3">
                  {agenda.map((k) => (
                    <li key={k.id} className="flex items-center gap-3">
                      <CalendarDays size={18} className={k.jenis === "libur" ? "text-coral" : "text-sage-tua"} />
                      <span className="flex-1 text-sm font-bold">{k.judul}</span>
                      <span className="text-xs text-redup">{formatPendek(k.tglMulai)}</span>
                    </li>
                  ))}
                </ul>
              </Kartu>
            </div>
          )}

          {tab === "akun" && <AkunOrtu />}
        </>
      )}
      {!dipilih && tab === "akun" && <AkunOrtu />}

      <nav className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-md">
        <ul className="clay flex justify-around px-2 py-2">
          {(
            [
              ["beranda", "Beranda", House],
              ["kehadiran", "Kehadiran", CalendarCheck],
              ["info", "Info", Megaphone],
              ["akun", "Akun", UserRound],
            ] as const
          ).map(([k, label, Ikon]) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => setTab(k)}
                className={cx(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[11px] font-bold",
                  tab === k ? "bg-coral-muda text-coral-tua" : "text-redup",
                )}
              >
                <Ikon size={20} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function AkunOrtu() {
  const p = usePengguna();
  const ortu = useKoleksi("ortu").find((o) => o.id === p?.ortuId);
  const toast = useToast();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [galat, setGalat] = useState<{ lama?: string; baru?: string; ulang?: string }>({});

  function simpan() {
    const g = {
      lama: lama !== p?.password ? "Kata sandi lama salah." : undefined,
      baru: baru.length < 6 ? "Minimal 6 karakter." : undefined,
      ulang: ulang !== baru ? "Konfirmasi tidak sama." : undefined,
    };
    if (g.lama || g.baru || g.ulang) {
      setGalat(g);
      return;
    }
    ubah("pengguna", p!.id, { password: baru });
    setLama("");
    setBaru("");
    setUlang("");
    setGalat({});
    toast("Kata sandi berhasil diubah.");
  }

  return (
    <div className="flex flex-col gap-4">
      <Kartu className="p-5">
        <p className="font-display font-bold">Profil</p>
        <dl className="mt-2 text-sm">
          {[
            ["Nama", ortu?.nama],
            ["Hubungan", ortu?.hubungan],
            ["Nomor HP", ortu?.hp],
            ["Pekerjaan", ortu?.pekerjaan],
          ].map(([a, b]) => (
            <div key={a} className="flex justify-between border-b border-garis/60 py-2 last:border-0">
              <dt className="text-redup">{a}</dt>
              <dd className="font-semibold">{b || "-"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-redup">Perubahan data profil dilakukan oleh operator sekolah.</p>
      </Kartu>
      <Kartu className="p-5">
        <p className="mb-3 font-display font-bold">Ubah kata sandi</p>
        <div className="flex flex-col gap-3">
          <Isian label="Kata sandi lama" galat={galat.lama}>
            {(id) => <Input id={id} type="password" value={lama} onChange={(e) => setLama(e.target.value)} />}
          </Isian>
          <Isian label="Kata sandi baru" galat={galat.baru}>
            {(id) => <Input id={id} type="password" value={baru} onChange={(e) => setBaru(e.target.value)} />}
          </Isian>
          <Isian label="Ulangi kata sandi baru" galat={galat.ulang}>
            {(id) => <Input id={id} type="password" value={ulang} onChange={(e) => setUlang(e.target.value)} />}
          </Isian>
          <Tombol onClick={simpan} className="mt-1">
            Simpan
          </Tombol>
        </div>
      </Kartu>
    </div>
  );
}
