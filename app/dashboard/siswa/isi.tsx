"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, GraduationCap, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import {
  Avatar,
  Halaman,
  Input,
  Isian,
  JudulHalaman,
  Kartu,
  Konfirmasi,
  KotakCari,
  Lencana,
  Modal,
  Pilihan,
  Tabel,
  Tombol,
  TombolIkon,
  useToast,
  type Nada,
} from "@/components/ui";
import { ambil, GagalSimpanError, hapus, semua, tambah, ubah, useKoleksi } from "@/lib/db/store";
import type { KeanggotaanKelas, Ortu, Siswa, StatusSiswa } from "@/lib/db/types";
import { hitungPresensi, useRombelSaya, useRombelTA } from "@/lib/data";
import { punya, usePengguna, useTahunAjaran } from "@/lib/sesi";
import { formatPendek, hariIni, umur } from "@/lib/tanggal";
import { adaGalat, digit, nomorHp, wajib, type Galat } from "@/lib/validasi";

const PER_HALAMAN = 20;

const NADA_STATUS: Record<StatusSiswa, Nada> = { aktif: "sage", lulus: "langit", pindah: "mustard", keluar: "coral" };

type Baris = Siswa & { kk?: KeanggotaanKelas; kelas?: string };

export function IsiSiswa() {
  const p = usePengguna();
  const toast = useToast();
  const params = useSearchParams();
  const { dilihat, arsip, aktif } = useTahunAjaran();
  const siswa = useKoleksi("siswa");
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const rombelSaya = useRombelSaya(p);
  const admin = punya(p, "admin");
  const bisaUbah = admin && !arsip;

  const [cari, setCari] = useState(params.get("cari") ?? "");
  const [filterRombel, setFilterRombel] = useState(params.get("rombel") ?? "");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [hal, setHal] = useState(1);
  const [form, setForm] = useState<{ siswa?: Siswa } | null>(null);
  const [detail, setDetail] = useState<Siswa | null>(null);
  const [akanHapus, setAkanHapus] = useState<Siswa | null>(null);

  const baris = useMemo(() => {
    const idRombel = new Map(rombelSaya.map((r) => [r.id, r]));
    const kkTA = new Map(
      keanggotaan.filter((k) => k.tahunAjaranId === dilihat?.id && idRombel.has(k.rombelId)).map((k) => [k.siswaId, k]),
    );
    const k = cari.trim().toLowerCase();
    let hasil: Baris[] = siswa
      .map((s) => {
        const kk = kkTA.get(s.id);
        return { ...s, kk, kelas: kk ? idRombel.get(kk.rombelId)?.nama : undefined };
      })
      // Siswa tampil bila tercatat di rombel yang bisa diakses pada TA ini. Admin juga
      // melihat siswa aktif yang belum ditempatkan di kelas mana pun.
      .filter((s) => s.kk || (admin && !arsip && s.status === "aktif"));
    if (filterRombel === "-") hasil = hasil.filter((s) => !s.kk);
    else if (filterRombel) hasil = hasil.filter((s) => s.kk?.rombelId === filterRombel);
    if (filterStatus) hasil = hasil.filter((s) => s.status === filterStatus);
    if (k) hasil = hasil.filter((s) => s.nama.toLowerCase().includes(k) || s.nisn.includes(k) || s.nis.includes(k));
    return hasil.sort(
      (a, b) =>
        (a.kelas ?? "zz").localeCompare(b.kelas ?? "zz", undefined, { numeric: true }) ||
        (a.kk?.noAbsen ?? 0) - (b.kk?.noAbsen ?? 0) ||
        a.nama.localeCompare(b.nama),
    );
  }, [siswa, keanggotaan, rombelSaya, dilihat, cari, filterRombel, filterStatus, admin, arsip]);

  const halaman = baris.slice((hal - 1) * PER_HALAMAN, hal * PER_HALAMAN);
  const belumBerkelas = admin && !arsip ? baris.filter((b) => !b.kk).length : 0;

  function cobaHapus(s: Siswa) {
    const idKk = keanggotaan.filter((k) => k.siswaId === s.id).map((k) => k.id);
    const punyaRiwayat =
      keanggotaan.some((k) => k.siswaId === s.id && k.tahunAjaranId !== aktif?.id) ||
      semua("presensi").some((x) => idKk.some((id) => x.status[id]));
    if (punyaRiwayat) {
      toast("Siswa ini sudah punya riwayat absensi/kelas. Ubah statusnya menjadi Pindah atau Keluar melalui Edit.", "info");
      return;
    }
    setAkanHapus(s);
  }

  function hapusPermanen(s: Siswa) {
    keanggotaan.filter((k) => k.siswaId === s.id).forEach((k) => hapus("keanggotaanKelas", k.id));
    for (const o of semua("ortu").filter((o) => o.siswaIds.includes(s.id))) {
      ubah("ortu", o.id, { siswaIds: o.siswaIds.filter((x) => x !== s.id) });
    }
    hapus("siswa", s.id);
    toast(`${s.nama} dihapus.`);
  }

  return (
    <>
      <JudulHalaman
        judul="Data Siswa"
        sub={`${baris.length} siswa · TA ${dilihat?.nama}${!admin ? " · kelas yang Anda ampu" : ""}`}
        aksi={
          bisaUbah && (
            <Tombol ikon={Plus} onClick={() => setForm({})}>
              Tambah Siswa
            </Tombol>
          )
        }
      />

      <Kartu className="overflow-hidden">
        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <KotakCari
            nilai={cari}
            ubah={(v) => {
              setCari(v);
              setHal(1);
            }}
            placeholder="Cari nama, NISN, atau NIS…"
            className="md:w-80"
          />
          <div className="grid grid-cols-2 gap-3 md:flex">
            <Pilihan
              value={filterRombel}
              onChange={(e) => {
                setFilterRombel(e.target.value);
                setHal(1);
              }}
              aria-label="Filter kelas"
              className="md:w-44"
            >
              <option value="">Semua kelas</option>
              {rombelSaya.map((r) => (
                <option key={r.id} value={r.id}>
                  Kelas {r.nama}
                </option>
              ))}
              {admin && !arsip && <option value="-">Belum ada kelas</option>}
            </Pilihan>
            <Pilihan
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setHal(1);
              }}
              aria-label="Filter status"
              className="md:w-40"
            >
              <option value="">Semua status</option>
              <option value="aktif">Aktif</option>
              <option value="lulus">Lulus</option>
              <option value="pindah">Pindah</option>
              <option value="keluar">Keluar</option>
            </Pilihan>
          </div>
          {belumBerkelas > 0 && filterRombel !== "-" && (
            <button type="button" onClick={() => setFilterRombel("-")} className="text-sm font-bold text-coral-tua md:ml-auto">
              {belumBerkelas} siswa belum punya kelas
            </button>
          )}
        </div>

        <Tabel<Baris>
          baris={halaman}
          kosong={<KosongSiswa />}
          judulMobile={(s) => (
            <div className="flex items-center gap-3">
              <Avatar nama={s.nama} />
              <div>
                <p className="font-bold">{s.nama}</p>
                <p className="text-xs text-redup">NISN {s.nisn}</p>
              </div>
            </div>
          )}
          kolom={[
            { kunci: "no", label: "No", isi: (s) => s.kk?.noAbsen ?? "-", kelas: "w-14 text-redup", sembunyiMobile: true },
            {
              kunci: "nama",
              label: "Nama Siswa",
              sembunyiMobile: true,
              isi: (s) => (
                <div className="flex items-center gap-3">
                  <Avatar nama={s.nama} />
                  <div>
                    <p className="font-bold">{s.nama}</p>
                    <p className="text-xs text-redup">
                      NISN {s.nisn} · NIS {s.nis}
                    </p>
                  </div>
                </div>
              ),
            },
            { kunci: "kelas", label: "Kelas", isi: (s) => (s.kelas ? <Lencana nada="coral">{s.kelas}</Lencana> : <span className="text-redup">Belum ada</span>) },
            { kunci: "jk", label: "L/P", isi: (s) => s.jk },
            { kunci: "umur", label: "Umur", isi: (s) => `${umur(s.tglLahir)} th` },
            { kunci: "status", label: "Status", isi: (s) => <Lencana nada={NADA_STATUS[s.status]}>{s.status}</Lencana> },
          ]}
          aksi={(s) => (
            <>
              <TombolIkon ikon={Eye} label="Lihat detail" onClick={() => setDetail(s)} />
              {bisaUbah && (
                <>
                  <TombolIkon ikon={Pencil} label="Edit" onClick={() => setForm({ siswa: s })} />
                  <TombolIkon ikon={Trash2} label="Hapus" onClick={() => cobaHapus(s)} className="hover:text-coral-tua" />
                </>
              )}
            </>
          )}
        />
        <Halaman total={baris.length} halaman={hal} perHalaman={PER_HALAMAN} ubah={setHal} />
      </Kartu>

      {form && <FormSiswa awal={form.siswa} tutup={() => setForm(null)} />}
      {detail && <DetailSiswa siswa={detail} tutup={() => setDetail(null)} />}
      <Konfirmasi
        buka={!!akanHapus}
        tutup={() => setAkanHapus(null)}
        judul="Hapus siswa?"
        pesan={
          <>
            <b>{akanHapus?.nama}</b> belum punya riwayat absensi, jadi bisa dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </>
        }
        onYa={() => akanHapus && hapusPermanen(akanHapus)}
      />
    </>
  );
}

function KosongSiswa() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-krem-tua text-redup">
        <GraduationCap size={28} />
      </span>
      <p className="font-display text-lg font-bold">Tidak ada siswa</p>
      <p className="max-w-sm text-sm text-redup">Coba ubah kata kunci atau filter.</p>
    </div>
  );
}

// ---------- form tambah/edit ----------

type DataForm = Omit<Siswa, "id"> & {
  rombelId: string;
  ortuNama: string;
  ortuHubungan: Ortu["hubungan"];
  ortuHp: string;
  ortuPekerjaan: string;
};

function FormSiswa({ awal, tutup }: { awal?: Siswa; tutup: () => void }) {
  const toast = useToast();
  const { aktif } = useTahunAjaran();
  const rombelAktif = useRombelTA(aktif?.id);
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const kkAktif = awal ? keanggotaan.find((k) => k.siswaId === awal.id && k.tahunAjaranId === aktif?.id) : undefined;
  const ortuAda = awal ? semua("ortu").find((o) => o.siswaIds.includes(awal.id)) : undefined;

  const [d, setD] = useState<DataForm>({
    nisn: awal?.nisn ?? "",
    nis: awal?.nis ?? "",
    nik: awal?.nik ?? "",
    nama: awal?.nama ?? "",
    jk: awal?.jk ?? "L",
    tempatLahir: awal?.tempatLahir ?? "Sumbawa Besar",
    tglLahir: awal?.tglLahir ?? "",
    agama: awal?.agama ?? "Islam",
    alamat: awal?.alamat ?? "",
    tglMasuk: awal?.tglMasuk ?? hariIni(),
    status: awal?.status ?? "aktif",
    rombelId: kkAktif?.rombelId ?? "",
    ortuNama: ortuAda?.nama ?? "",
    ortuHubungan: ortuAda?.hubungan ?? "Ibu",
    ortuHp: ortuAda?.hp ?? "",
    ortuPekerjaan: ortuAda?.pekerjaan ?? "",
  });
  const [galat, setGalat] = useState<Galat<DataForm>>({});
  const set = <K extends keyof DataForm>(k: K, v: DataForm[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setGalat((g) => ({ ...g, [k]: undefined }));
  };

  function simpan() {
    const semuaSiswa = semua("siswa");
    const g: Galat<DataForm> = {
      nama: wajib(d.nama, "Nama"),
      nisn: digit(d.nisn, 10, "NISN") ?? (semuaSiswa.some((s) => s.nisn === d.nisn && s.id !== awal?.id) ? "NISN sudah dipakai siswa lain." : undefined),
      nik: digit(d.nik, 16, "NIK", true) ?? (d.nik && semuaSiswa.some((s) => s.nik === d.nik && s.id !== awal?.id) ? "NIK sudah dipakai siswa lain." : undefined),
      tglLahir: wajib(d.tglLahir, "Tanggal lahir") ?? (d.tglLahir > hariIni() ? "Tanggal lahir tidak boleh di masa depan." : undefined),
      tempatLahir: wajib(d.tempatLahir, "Tempat lahir"),
      rombelId: d.status === "aktif" && !awal && !d.rombelId ? "Pilih kelas untuk siswa baru." : undefined,
      ortuNama: !ortuAda && d.ortuHp && !d.ortuNama.trim() ? "Isi nama orang tua." : undefined,
      ortuHp: !ortuAda && d.ortuNama ? nomorHp(d.ortuHp) : undefined,
    };
    if (adaGalat(g)) {
      setGalat(g);
      return;
    }

    try {
      const dataSiswa: Omit<Siswa, "id"> = {
        nisn: d.nisn,
        nis: d.nis.trim(),
        nik: d.nik.trim(),
        nama: d.nama.trim(),
        jk: d.jk,
        tempatLahir: d.tempatLahir.trim(),
        tglLahir: d.tglLahir,
        agama: d.agama,
        alamat: d.alamat.trim(),
        tglMasuk: d.tglMasuk,
        status: d.status,
      };
      const s = awal ? (ubah("siswa", awal.id, dataSiswa), { ...awal, ...dataSiswa }) : tambah("siswa", dataSiswa);

      // Penempatan kelas pada tahun ajaran aktif.
      if (aktif) {
        const statusKk = d.status === "aktif" ? "aktif" : d.status === "lulus" ? "lulus" : "pindah";
        if (kkAktif && d.rombelId && kkAktif.rombelId !== d.rombelId) {
          const noAkhir = Math.max(0, ...semua("keanggotaanKelas").filter((k) => k.rombelId === d.rombelId).map((k) => k.noAbsen));
          ubah("keanggotaanKelas", kkAktif.id, { rombelId: d.rombelId, noAbsen: noAkhir + 1, statusAkhir: statusKk });
        } else if (kkAktif) {
          ubah("keanggotaanKelas", kkAktif.id, { statusAkhir: statusKk });
        } else if (d.rombelId) {
          const noAkhir = Math.max(0, ...semua("keanggotaanKelas").filter((k) => k.rombelId === d.rombelId).map((k) => k.noAbsen));
          tambah("keanggotaanKelas", {
            siswaId: s.id,
            rombelId: d.rombelId,
            tahunAjaranId: aktif.id,
            noAbsen: noAkhir + 1,
            statusAkhir: "aktif",
          });
        }
      }

      // Orang tua: hubungkan ke ortu yang sudah ada bila nomor HP sama (kakak-adik).
      if (!ortuAda && d.ortuNama.trim()) {
        const hp = d.ortuHp.replace(/[\s-]/g, "");
        const sama = semua("ortu").find((o) => o.hp === hp);
        if (sama) {
          ubah("ortu", sama.id, { siswaIds: [...sama.siswaIds, s.id] });
          toast(`Dihubungkan ke orang tua yang sudah terdaftar: ${sama.nama}.`, "info");
        } else {
          const o = tambah("ortu", {
            nama: d.ortuNama.trim(),
            hubungan: d.ortuHubungan,
            hp,
            pekerjaan: d.ortuPekerjaan.trim(),
            siswaIds: [s.id],
          });
          tambah("pengguna", { username: hp, password: "ortu123", nama: o.nama, peran: ["ortu"], ortuId: o.id });
        }
      }

      toast(awal ? "Data siswa diperbarui." : `${s.nama} ditambahkan.`);
      tutup();
    } catch (e) {
      toast(e instanceof GagalSimpanError ? e.message : "Gagal menyimpan data.", "galat");
    }
  }

  return (
    <Modal
      buka
      tutup={tutup}
      judul={awal ? "Edit Data Siswa" : "Tambah Siswa"}
      deskripsi="Field bertanda * wajib diisi. Format mengikuti Dapodik."
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
        <Isian label="Nama lengkap" wajib galat={galat.nama} className="sm:col-span-2">
          {(id) => <Input id={id} value={d.nama} onChange={(e) => set("nama", e.target.value)} autoFocus />}
        </Isian>
        <Isian label="NISN" wajib galat={galat.nisn} bantuan="10 digit">
          {(id) => <Input id={id} inputMode="numeric" maxLength={10} value={d.nisn} onChange={(e) => set("nisn", e.target.value.replace(/\D/g, ""))} />}
        </Isian>
        <Isian label="NIS (nomor induk sekolah)">
          {(id) => <Input id={id} value={d.nis} onChange={(e) => set("nis", e.target.value)} />}
        </Isian>
        <Isian label="NIK" galat={galat.nik} bantuan="16 digit, opsional">
          {(id) => <Input id={id} inputMode="numeric" maxLength={16} value={d.nik} onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))} />}
        </Isian>
        <Isian label="Jenis kelamin" wajib>
          {(id) => (
            <Pilihan id={id} value={d.jk} onChange={(e) => set("jk", e.target.value as "L" | "P")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Pilihan>
          )}
        </Isian>
        <Isian label="Tempat lahir" wajib galat={galat.tempatLahir}>
          {(id) => <Input id={id} value={d.tempatLahir} onChange={(e) => set("tempatLahir", e.target.value)} />}
        </Isian>
        <Isian label="Tanggal lahir" wajib galat={galat.tglLahir}>
          {(id) => <Input id={id} type="date" value={d.tglLahir} onChange={(e) => set("tglLahir", e.target.value)} />}
        </Isian>
        <Isian label="Agama">
          {(id) => (
            <Pilihan id={id} value={d.agama} onChange={(e) => set("agama", e.target.value)}>
              {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Pilihan>
          )}
        </Isian>
        <Isian label="Tanggal masuk">
          {(id) => <Input id={id} type="date" value={d.tglMasuk} onChange={(e) => set("tglMasuk", e.target.value)} />}
        </Isian>
        <Isian label="Alamat" className="sm:col-span-2">
          {(id) => <Input id={id} value={d.alamat} onChange={(e) => set("alamat", e.target.value)} />}
        </Isian>
        <Isian label={`Kelas (TA ${aktif?.nama})`} wajib={!awal} galat={galat.rombelId}>
          {(id) => (
            <Pilihan id={id} value={d.rombelId} onChange={(e) => set("rombelId", e.target.value)}>
              <option value="">— Belum ditempatkan —</option>
              {rombelAktif.map((r) => (
                <option key={r.id} value={r.id}>
                  Kelas {r.nama}
                </option>
              ))}
            </Pilihan>
          )}
        </Isian>
        <Isian label="Status" bantuan="Siswa pindah/keluar tetap disimpan beserta riwayatnya.">
          {(id) => (
            <Pilihan id={id} value={d.status} onChange={(e) => set("status", e.target.value as StatusSiswa)}>
              <option value="aktif">Aktif</option>
              <option value="pindah">Pindah sekolah</option>
              <option value="keluar">Keluar</option>
              <option value="lulus">Lulus</option>
            </Pilihan>
          )}
        </Isian>

        <div className="mt-2 rounded-3xl bg-krem/80 p-4 sm:col-span-2">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold">
            <UserRound size={16} /> Orang tua / wali
          </p>
          {ortuAda ? (
            <p className="text-sm text-tinta-2">
              Terhubung dengan <b>{ortuAda.nama}</b> ({ortuAda.hubungan}, {ortuAda.hp}). Ubah data orang tua di menu <b>Orang Tua</b>.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Isian label="Nama orang tua" galat={galat.ortuNama}>
                {(id) => <Input id={id} value={d.ortuNama} onChange={(e) => set("ortuNama", e.target.value)} />}
              </Isian>
              <Isian label="Hubungan">
                {(id) => (
                  <Pilihan id={id} value={d.ortuHubungan} onChange={(e) => set("ortuHubungan", e.target.value as Ortu["hubungan"])}>
                    <option>Ibu</option>
                    <option>Ayah</option>
                    <option>Wali</option>
                  </Pilihan>
                )}
              </Isian>
              <Isian label="Nomor HP (untuk login portal)" galat={galat.ortuHp} bantuan="Jika nomor sudah terdaftar, siswa dihubungkan sebagai saudara.">
                {(id) => <Input id={id} inputMode="tel" value={d.ortuHp} onChange={(e) => set("ortuHp", e.target.value)} />}
              </Isian>
              <Isian label="Pekerjaan">
                {(id) => <Input id={id} value={d.ortuPekerjaan} onChange={(e) => set("ortuPekerjaan", e.target.value)} />}
              </Isian>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------- detail ----------

function DetailSiswa({ siswa: s, tutup }: { siswa: Siswa; tutup: () => void }) {
  const keanggotaan = useKoleksi("keanggotaanKelas");
  const rombel = useKoleksi("rombel");
  const tahunAjaran = useKoleksi("tahunAjaran");
  const presensi = useKoleksi("presensi");
  const ortu = useKoleksi("ortu");
  const guru = useKoleksi("guru");
  const terbaru = ambil("siswa", s.id) ?? s;

  const riwayat = useMemo(
    () =>
      keanggotaan
        .filter((k) => k.siswaId === s.id)
        .map((k) => {
          const r = rombel.find((x) => x.id === k.rombelId);
          const ta = tahunAjaran.find((t) => t.id === k.tahunAjaranId);
          const rekap = hitungPresensi(
            presensi.filter((x) => x.rombelId === k.rombelId && x.status[k.id]).map((x) => ({ ...x, status: { [k.id]: x.status[k.id] } })),
          );
          return { k, r, ta, rekap, wali: guru.find((g) => g.id === r?.waliKelasGuruId)?.nama };
        })
        .sort((a, b) => (b.ta?.nama ?? "").localeCompare(a.ta?.nama ?? "")),
    [keanggotaan, rombel, tahunAjaran, presensi, guru, s.id],
  );
  const ortuSiswa = ortu.filter((o) => o.siswaIds.includes(s.id));

  const LABEL_KK: Record<string, [string, Nada]> = {
    aktif: ["Sedang berjalan", "sage"],
    naik: ["Naik kelas", "langit"],
    tinggal: ["Tinggal kelas", "mustard"],
    lulus: ["Lulus", "lavender"],
    pindah: ["Pindah", "coral"],
  };

  return (
    <Modal buka tutup={tutup} judul="Profil Siswa" lebar="lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar nama={terbaru.nama} ukuran={64} />
          <div>
            <p className="font-display text-xl font-bold">{terbaru.nama}</p>
            <p className="text-sm text-redup">
              NISN {terbaru.nisn} · NIS {terbaru.nis || "-"}
            </p>
            <div className="mt-1">
              <Lencana nada={NADA_STATUS[terbaru.status]}>{terbaru.status}</Lencana>
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-3xl bg-krem/70 p-4 text-sm sm:grid-cols-2">
          {[
            ["Jenis kelamin", terbaru.jk === "L" ? "Laki-laki" : "Perempuan"],
            ["Tempat, tgl lahir", `${terbaru.tempatLahir}, ${formatPendek(terbaru.tglLahir)} (${umur(terbaru.tglLahir)} th)`],
            ["NIK", terbaru.nik || "-"],
            ["Agama", terbaru.agama],
            ["Tanggal masuk", formatPendek(terbaru.tglMasuk)],
            ["Alamat", terbaru.alamat || "-"],
          ].map(([a, b]) => (
            <div key={a} className="flex justify-between gap-4 sm:block">
              <dt className="text-redup">{a}</dt>
              <dd className="text-right font-semibold sm:text-left">{b}</dd>
            </div>
          ))}
        </dl>

        <div>
          <h3 className="mb-2 font-bold">Orang tua / wali</h3>
          {ortuSiswa.length === 0 ? (
            <p className="text-sm text-redup">Belum ada data orang tua.</p>
          ) : (
            ortuSiswa.map((o) => (
              <p key={o.id} className="text-sm">
                <b>{o.nama}</b> ({o.hubungan}) · {o.hp} · {o.pekerjaan}
              </p>
            ))
          )}
        </div>

        <div>
          <h3 className="mb-2 font-bold">Riwayat kelas</h3>
          <ol className="flex flex-col gap-2">
            {riwayat.map(({ k, r, ta, rekap, wali }) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-garis p-3 text-sm">
                <span className="clay-sm grid size-11 place-items-center bg-coral-muda font-display font-bold text-coral-tua">{r?.nama}</span>
                <span className="min-w-40 flex-1">
                  <span className="block font-bold">
                    TA {ta?.nama} {ta?.status === "ditutup" && <span className="font-normal text-redup">(arsip)</span>}
                  </span>
                  <span className="block text-xs text-redup">
                    No. absen {k.noAbsen} · Wali kelas {wali ?? "-"}
                  </span>
                </span>
                {rekap.total > 0 && (
                  <span className="text-xs text-tinta-2">
                    Hadir {Math.round(rekap.persenHadir)}% · S {rekap.S} · I {rekap.I} · A {rekap.A}
                  </span>
                )}
                <Lencana nada={LABEL_KK[k.statusAkhir][1]}>{LABEL_KK[k.statusAkhir][0]}</Lencana>
              </li>
            ))}
            {riwayat.length === 0 && <p className="text-sm text-redup">Belum pernah ditempatkan di kelas.</p>}
          </ol>
        </div>
      </div>
    </Modal>
  );
}

