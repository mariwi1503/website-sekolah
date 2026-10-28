import { dariISO, hariSekolah, keISO, tambahHari } from "../tanggal";
import type {
  Guru,
  Jurnal,
  Kalender,
  KeanggotaanKelas,
  Koleksi,
  Mapel,
  Ortu,
  Pengampu,
  Pengguna,
  Pengumuman,
  Presensi,
  Rombel,
  Siswa,
  StatusPresensi,
  TahunAjaran,
} from "./types";

// Data dummy dibuat dengan PRNG ber-seed agar hasilnya sama di setiap browser.
// Tanggal dihitung relatif terhadap hari ini supaya prototipe selalu terlihat "hidup".

type DataAwal = { [K in keyof Koleksi]: Koleksi[K][] };

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMA_L = [
  "Muhammad", "Ahmad", "Rizki", "Fadli", "Ilham", "Alif", "Syahrul", "Rahmat", "Arya", "Fauzan",
  "Dimas", "Rafi", "Hafiz", "Zaki", "Bima", "Raka", "Akbar", "Yusuf", "Farhan", "Daffa",
  "Iqbal", "Gilang", "Reza", "Aldi", "Haikal", "Aqil", "Kevin", "Naufal", "Satria", "Wahyu",
];
const NAMA_P = [
  "Nur", "Siti", "Aisyah", "Nabila", "Salsabila", "Putri", "Dinda", "Zaskia", "Aulia", "Rahma",
  "Annisa", "Fitri", "Khairunnisa", "Nadia", "Amelia", "Citra", "Azzahra", "Keysha", "Intan", "Wulan",
  "Safira", "Laila", "Dewi", "Hana", "Alya", "Naura", "Rania", "Tiara", "Najwa", "Kirana",
];
const NAMA_BELAKANG = [
  "Hidayat", "Saputra", "Ramadhan", "Maulana", "Pratama", "Firmansyah", "Kurniawan", "Hakim",
  "Rahmawati", "Wahyuni", "Lestari", "Safitri", "Maharani", "Anggraini", "Sari", "Ningsih",
  "Hasan", "Ismail", "Abdullah", "Syamsuddin", "Jamaluddin", "Mustafa", "Sudirman", "Nurdin",
];
const PEKERJAAN = [
  "Petani", "Nelayan", "Wiraswasta", "Pedagang", "PNS", "Guru", "Karyawan Swasta",
  "Ibu Rumah Tangga", "Peternak", "Sopir", "Buruh", "Perawat",
];
const DESA = ["Brang Bara", "Seketeng", "Lempeh", "Bugis", "Samapuin", "Pekat", "Uma Sima", "Kerato"];

const MAPEL: Mapel[] = [
  { id: "mp_pai", kode: "PAI", nama: "Pendidikan Agama Islam dan Budi Pekerti", kelompok: "Umum", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
  { id: "mp_pp", kode: "PP", nama: "Pendidikan Pancasila", kelompok: "Umum", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
  { id: "mp_bind", kode: "BIND", nama: "Bahasa Indonesia", kelompok: "Umum", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
  { id: "mp_mtk", kode: "MTK", nama: "Matematika", kelompok: "Umum", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
  { id: "mp_ipas", kode: "IPAS", nama: "Ilmu Pengetahuan Alam dan Sosial", kelompok: "Umum", tingkatBerlaku: [3, 4, 5, 6] },
  { id: "mp_pjok", kode: "PJOK", nama: "Pendidikan Jasmani, Olahraga, dan Kesehatan", kelompok: "Umum", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
  { id: "mp_sr", kode: "SR", nama: "Seni Rupa", kelompok: "Umum", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
  { id: "mp_bing", kode: "BING", nama: "Bahasa Inggris", kelompok: "Umum", tingkatBerlaku: [3, 4, 5, 6] },
  { id: "mp_bsmw", kode: "BSMW", nama: "Bahasa Daerah (Basa Samawa)", kelompok: "Muatan Lokal", tingkatBerlaku: [1, 2, 3, 4, 5, 6] },
];

const MATERI: Record<string, string[]> = {
  mp_bind: ["Membaca teks cerita rakyat", "Menulis paragraf deskripsi", "Kata baku dan tidak baku", "Menyimak dongeng", "Puisi anak"],
  mp_mtk: ["Penjumlahan bersusun", "Pecahan senilai", "Bangun datar", "Pengukuran panjang", "Perkalian dan pembagian"],
  mp_pp: ["Makna sila-sila Pancasila", "Hak dan kewajiban di sekolah", "Keberagaman di lingkunganku", "Gotong royong"],
  mp_ipas: ["Siklus air", "Bagian tubuh tumbuhan", "Peta dan arah mata angin", "Sumber energi"],
  mp_sr: ["Menggambar ekspresif", "Kolase dari bahan alam", "Warna primer dan sekunder"],
  mp_bsmw: ["Kosakata Basa Samawa sehari-hari", "Lawas Samawa", "Cerita rakyat Tanah Samawa"],
  mp_pjok: ["Gerak dasar lari", "Permainan bola kecil", "Senam irama", "Kebugaran jasmani"],
};

export function buatDataAwal(sekarang: Date): DataAwal {
  const acak = mulberry32(16);
  const pilih = <T,>(arr: T[]) => arr[Math.floor(acak() * arr.length)];
  const angka = (n: number) => Array.from({ length: n }, () => Math.floor(acak() * 10)).join("");

  const hari = keISO(sekarang);
  const y = sekarang.getMonth() >= 6 ? sekarang.getFullYear() : sekarang.getFullYear() - 1;
  // Tahun ajaran dimulai hari Senin pertama setelah 12 Juli.
  const seninAwal = (th: number) => {
    let d = `${th}-07-13`;
    while (dariISO(d).getDay() !== 1) d = tambahHari(d, 1);
    return d;
  };

  // ---------- tahun ajaran ----------
  const taLalu: TahunAjaran = {
    id: `ta_${y - 1}`,
    nama: `${y - 1}/${y}`,
    semesterAktif: 2,
    tglMulai: seninAwal(y - 1),
    tglSelesai: `${y}-06-20`,
    status: "ditutup",
  };
  const taAktif: TahunAjaran = {
    id: `ta_${y}`,
    nama: `${y}/${y + 1}`,
    semesterAktif: hari >= `${y + 1}-01-01` ? 2 : 1,
    tglMulai: seninAwal(y),
    tglSelesai: `${y + 1}-06-20`,
    status: "aktif",
  };

  // ---------- kalender ----------
  const kalender: Kalender[] = [
    { id: "kal_1", judul: "Masa Pengenalan Lingkungan Sekolah (MPLS)", tglMulai: seninAwal(y), tglSelesai: tambahHari(seninAwal(y), 2), jenis: "kegiatan" },
    { id: "kal_2", judul: `HUT ke-${y - 1945} Republik Indonesia`, tglMulai: `${y}-08-17`, tglSelesai: `${y}-08-17`, jenis: "libur" },
    { id: "kal_3", judul: "Sumatif Tengah Semester (STS) Ganjil", tglMulai: `${y}-09-21`, tglSelesai: `${y}-09-26`, jenis: "ujian" },
    { id: "kal_4", judul: "Peringatan Hari Guru Nasional", tglMulai: `${y}-11-25`, tglSelesai: `${y}-11-25`, jenis: "kegiatan" },
    { id: "kal_5", judul: "Sumatif Akhir Semester (SAS) Ganjil", tglMulai: `${y}-12-01`, tglSelesai: `${y}-12-08`, jenis: "ujian" },
    { id: "kal_6", judul: "Pembagian Rapor Semester Ganjil", tglMulai: `${y}-12-19`, tglSelesai: `${y}-12-19`, jenis: "kegiatan" },
    { id: "kal_7", judul: "Libur Semester Ganjil", tglMulai: `${y}-12-21`, tglSelesai: `${y + 1}-01-03`, jenis: "libur" },
    { id: "kal_8", judul: "Sumatif Tengah Semester (STS) Genap", tglMulai: `${y + 1}-03-09`, tglSelesai: `${y + 1}-03-14`, jenis: "ujian" },
    { id: "kal_9", judul: "Sumatif Akhir Tahun (SAT)", tglMulai: `${y + 1}-06-01`, tglSelesai: `${y + 1}-06-06`, jenis: "ujian" },
    { id: "kal_10", judul: "Pembagian Rapor & Kenaikan Kelas", tglMulai: `${y + 1}-06-19`, tglSelesai: `${y + 1}-06-19`, jenis: "kegiatan" },
    { id: "kal_11", judul: "Libur Kenaikan Kelas", tglMulai: `${y + 1}-06-22`, tglSelesai: `${y + 1}-07-11`, jenis: "libur" },
  ];

  // ---------- guru ----------
  let urutGuru = 0;
  function buatGuru(
    nama: string,
    jk: "L" | "P",
    jabatan: string,
    status: Guru["statusKepegawaian"],
    tahunLahir: number,
  ): Guru {
    urutGuru++;
    const lahir = `${tahunLahir}-${String(1 + Math.floor(acak() * 12)).padStart(2, "0")}-${String(1 + Math.floor(acak() * 28)).padStart(2, "0")}`;
    const nip =
      status === "Honorer"
        ? ""
        : `${lahir.replaceAll("-", "")}${tahunLahir + 24}0${1 + Math.floor(acak() * 9)}${jk === "L" ? 1 : 2}${String(urutGuru).padStart(3, "0")}`;
    const slug = nama.split(",")[0].replace(/^(Drs\.|Hj?\.)\s*/g, "").replace(/^(H\.|Hj\.)\s*/g, "").toLowerCase().split(" ").slice(0, 2).join(".");
    return {
      id: `gr_${String(urutGuru).padStart(2, "0")}`,
      nama,
      nip,
      nuptk: angka(16),
      jk,
      tempatLahir: pilih(["Sumbawa Besar", "Sumbawa", "Alas", "Empang", "Utan", "Mataram"]),
      tglLahir: lahir,
      hp: `08${pilih(["12", "13", "19", "23", "52", "53"])}${angka(8)}`,
      email: `${slug}@azzahra.sch.id`,
      jabatan,
      statusKepegawaian: status,
      aktif: true,
    };
  }

  const kepsek = buatGuru("Drs. H. Abdul Haris, M.Pd.", "L", "Kepala Sekolah", "PNS", 1971);
  const daftarWali: [string, "L" | "P", Guru["statusKepegawaian"], number][] = [
    ["Sri Wahyuni, S.Pd.", "P", "PNS", 1980],
    ["Hasanah, S.Pd.", "P", "PPPK", 1988],
    ["Muhammad Ikhsan, S.Pd.", "L", "PNS", 1985],
    ["Rahmawati, S.Pd.", "P", "PPPK", 1990],
    ["Baiq Mardiana, S.Pd.", "P", "PNS", 1983],
    ["Ahmad Jaelani, S.Pd.", "L", "PNS", 1979],
    ["Nurul Hidayah, S.Pd.", "P", "PNS", 1986],
    ["Syamsul Bahri, S.Pd.", "L", "PPPK", 1987],
    ["Dewi Kartika, S.Pd.", "P", "PNS", 1982],
    ["Irwan Saputra, S.Pd.", "L", "Honorer", 1995],
    ["Fitriani, S.Pd.", "P", "PNS", 1978],
    ["Zulkarnain, S.Pd.", "L", "PNS", 1976],
  ];
  const wali = daftarWali.map(([n, jk, st, th]) => buatGuru(n, jk, "Guru Kelas", st, th));
  const guruPai = [
    buatGuru("H. Mustafa Kamal, S.Pd.I.", "L", "Guru PAI", "PNS", 1977),
    buatGuru("Siti Aminah, S.Pd.I.", "P", "Guru PAI", "PPPK", 1989),
  ];
  const guruPjok = [
    buatGuru("Rahmat Hidayat, S.Pd.", "L", "Guru PJOK", "PNS", 1984),
    buatGuru("Andi Wijaya, S.Pd.", "L", "Guru PJOK", "Honorer", 1997),
  ];
  const guruBing = buatGuru("Annisa Rahma, S.Pd.", "P", "Guru Bahasa Inggris", "Honorer", 1996);
  const guru: Guru[] = [kepsek, ...wali, ...guruPai, ...guruPjok, guruBing];

  // ---------- rombel ----------
  const huruf = ["A", "B"];
  function buatRombel(ta: TahunAjaran): Rombel[] {
    const hasil: Rombel[] = [];
    for (let t = 1; t <= 6; t++) {
      huruf.forEach((h, i) => {
        hasil.push({
          id: `rb_${ta.id.slice(3)}_${t}${h}`,
          tahunAjaranId: ta.id,
          tingkat: t,
          nama: `${t}${h}`,
          waliKelasGuruId: wali[(t - 1) * 2 + i].id,
        });
      });
    }
    return hasil;
  }
  const rombelLalu = buatRombel(taLalu);
  const rombelAktif = buatRombel(taAktif);
  // Pergantian wali kelas antar-tahun supaya riwayat terlihat berbeda.
  rombelLalu.forEach((r, i) => (r.waliKelasGuruId = wali[(i + 2) % wali.length].id));

  // ---------- siswa ----------
  const siswa: Siswa[] = [];
  const namaDipakai = new Set<string>();
  let urutSiswa = 0;
  function buatSiswa(tahunMasuk: number, status: Siswa["status"]): Siswa {
    urutSiswa++;
    const jk: "L" | "P" = acak() < 0.5 ? "L" : "P";
    let nama = "";
    do {
      const depan = pilih(jk === "L" ? NAMA_L : NAMA_P);
      const tengah = acak() < 0.35 ? " " + pilih(jk === "L" ? NAMA_L : NAMA_P) : "";
      nama = `${depan}${tengah} ${pilih(NAMA_BELAKANG)}`;
    } while (namaDipakai.has(nama));
    namaDipakai.add(nama);
    const thLahir = tahunMasuk - 6 - (acak() < 0.3 ? 1 : 0);
    const tglLahir = `${thLahir}-${String(1 + Math.floor(acak() * 12)).padStart(2, "0")}-${String(1 + Math.floor(acak() * 28)).padStart(2, "0")}`;
    const s: Siswa = {
      id: `sw_${String(urutSiswa).padStart(4, "0")}`,
      nisn: `0${String(thLahir).slice(2)}${angka(7)}`,
      nis: `${tahunMasuk}${String(urutSiswa).padStart(4, "0")}`,
      nik: `5204${angka(2)}${tglLahir.slice(8, 10)}${tglLahir.slice(5, 7)}${tglLahir.slice(2, 4)}${angka(4)}`,
      nama,
      jk,
      tempatLahir: pilih(["Sumbawa Besar", "Sumbawa", "Moyo Hilir", "Labuhan Badas", "Unter Iwes"]),
      tglLahir,
      agama: acak() < 0.97 ? "Islam" : pilih(["Hindu", "Kristen"]),
      alamat: `Kel. ${pilih(DESA)}, RT ${String(1 + Math.floor(acak() * 6)).padStart(3, "0")}/RW ${String(1 + Math.floor(acak() * 4)).padStart(3, "0")}, Sumbawa`,
      tglMasuk: seninAwal(tahunMasuk),
      status,
    };
    siswa.push(s);
    return s;
  }

  const keanggotaan: KeanggotaanKelas[] = [];
  let urutKk = 0;
  function masukkan(s: Siswa, rombel: Rombel, statusAkhir: KeanggotaanKelas["statusAkhir"]) {
    urutKk++;
    keanggotaan.push({
      id: `kk_${String(urutKk).padStart(4, "0")}`,
      siswaId: s.id,
      rombelId: rombel.id,
      tahunAjaranId: rombel.tahunAjaranId,
      noAbsen: 0,
      statusAkhir,
    });
  }

  // Siswa aktif sekarang. Kelas t sekarang = kelas t-1 tahun lalu (huruf sama).
  const anggotaAktif = new Map<string, Siswa[]>();
  for (const r of rombelAktif) {
    const n = 22 + Math.floor(acak() * 3);
    const daftar: Siswa[] = [];
    for (let i = 0; i < n; i++) daftar.push(buatSiswa(y - (r.tingkat - 1), "aktif"));
    anggotaAktif.set(r.id, daftar);
    daftar.forEach((s) => masukkan(s, r, "aktif"));
    if (r.tingkat > 1) {
      const asal = rombelLalu.find((x) => x.nama === `${r.tingkat - 1}${r.nama.slice(1)}`)!;
      daftar.forEach((s, i) => {
        // Satu siswa 3B tahun ini adalah siswa yang tinggal kelas di 3B tahun lalu.
        if (r.nama === "3B" && i === 0) {
          masukkan(s, rombelLalu.find((x) => x.nama === "3B")!, "tinggal");
          s.tglMasuk = seninAwal(y - 3);
        } else {
          masukkan(s, asal, "naik");
        }
      });
    }
  }
  // Angkatan yang sudah lulus (kelas 6 tahun lalu).
  for (const r of rombelLalu.filter((x) => x.tingkat === 6)) {
    for (let i = 0; i < 23; i++) masukkan(buatSiswa(y - 6, "lulus"), r, "lulus");
  }
  // Satu siswa pindah sekolah di akhir tahun lalu.
  masukkan(buatSiswa(y - 4, "pindah"), rombelLalu.find((x) => x.nama === "4A")!, "pindah");

  // Nomor absen urut abjad per rombel.
  const namaSiswa = new Map(siswa.map((s) => [s.id, s.nama]));
  for (const r of [...rombelLalu, ...rombelAktif]) {
    keanggotaan
      .filter((k) => k.rombelId === r.id)
      .sort((a, b) => namaSiswa.get(a.siswaId)!.localeCompare(namaSiswa.get(b.siswaId)!))
      .forEach((k, i) => (k.noAbsen = i + 1));
  }

  // ---------- orang tua ----------
  const ortu: Ortu[] = [];
  let urutOrtu = 0;
  const aktif = siswa.filter((s) => s.status === "aktif");
  const sudahPunyaOrtu = new Set<string>();
  function buatOrtu(anak: Siswa[], id?: string): Ortu {
    urutOrtu++;
    const hubungan: Ortu["hubungan"] = acak() < 0.6 ? "Ibu" : acak() < 0.93 ? "Ayah" : "Wali";
    const belakang = anak[0].nama.split(" ").at(-1)!;
    const o: Ortu = {
      id: id ?? `ot_${String(urutOrtu).padStart(4, "0")}`,
      nama: hubungan === "Ibu" ? `${pilih(NAMA_P)} ${pilih(NAMA_BELAKANG)}` : `${pilih(NAMA_L)} ${belakang}`,
      hubungan,
      hp: `08${pilih(["12", "13", "17", "19", "23", "52", "53", "77"])}${angka(8)}`,
      pekerjaan: hubungan === "Ibu" && acak() < 0.5 ? "Ibu Rumah Tangga" : pilih(PEKERJAAN),
      siswaIds: anak.map((a) => a.id),
    };
    anak.forEach((a) => sudahPunyaOrtu.add(a.id));
    ortu.push(o);
    return o;
  }
  // Ortu demo: punya anak di 4A dan 1B.
  const anak4A = anggotaAktif.get(rombelAktif.find((r) => r.nama === "4A")!.id)![3];
  const anak1B = anggotaAktif.get(rombelAktif.find((r) => r.nama === "1B")!.id)![5];
  const ortuDemo = buatOrtu([anak4A, anak1B], "ot_demo");
  ortuDemo.nama = "Hj. Fatimah Zahra";
  ortuDemo.hubungan = "Ibu";
  ortuDemo.pekerjaan = "Wiraswasta";
  ortuDemo.hp = "081234567816";
  // Beberapa pasang kakak-adik lain.
  for (let i = 0; i < 14; i++) {
    const kakak = pilih(aktif.filter((s) => !sudahPunyaOrtu.has(s.id) && s.tglMasuk < `${y - 2}`));
    const adik = pilih(aktif.filter((s) => !sudahPunyaOrtu.has(s.id) && s.tglMasuk >= `${y - 1}`));
    if (kakak && adik) buatOrtu([kakak, adik]);
  }
  for (const s of aktif) if (!sudahPunyaOrtu.has(s.id)) buatOrtu([s]);

  // ---------- pengampu ----------
  const pengampu: Pengampu[] = [];
  for (const r of [...rombelLalu, ...rombelAktif]) {
    for (const m of MAPEL.filter((x) => x.tingkatBerlaku.includes(r.tingkat))) {
      let guruId = r.waliKelasGuruId!;
      if (m.id === "mp_pai") guruId = guruPai[r.tingkat <= 3 ? 0 : 1].id;
      if (m.id === "mp_pjok") guruId = guruPjok[r.tingkat <= 3 ? 1 : 0].id;
      if (m.id === "mp_bing") guruId = guruBing.id;
      pengampu.push({ id: `pa_${r.id.slice(3)}_${m.kode}`, tahunAjaranId: r.tahunAjaranId, rombelId: r.id, mapelId: m.id, guruId });
    }
  }

  // ---------- pengguna ----------
  const pengguna: Pengguna[] = [
    { id: "pgn_admin", username: "admin", password: "admin123", nama: "Operator Sekolah", peran: ["admin"] },
  ];
  for (const g of guru) {
    const isKepsek = g.id === kepsek.id;
    pengguna.push({
      id: `pgn_${g.id}`,
      username: isKepsek ? "kepsek" : g.email.split("@")[0],
      password: isKepsek ? "kepsek123" : "guru123",
      nama: g.nama,
      peran: isKepsek ? ["kepsek", "guru"] : ["guru"],
      guruId: g.id,
    });
  }
  for (const o of ortu) {
    pengguna.push({
      id: o.id === "ot_demo" ? "pgn_ortu_demo" : `pgn_${o.id}`,
      username: o.hp,
      password: "ortu123",
      nama: o.nama,
      peran: ["ortu"],
      ortuId: o.id,
    });
  }

  // ---------- presensi ----------
  const presensi: Presensi[] = [];
  const rombel4A = rombelAktif.find((r) => r.nama === "4A")!;
  const kecenderungan = new Map(siswa.map((s) => [s.id, acak() < 0.12 ? 2.5 : 1]));
  const ALASAN_S = ["Demam", "Batuk dan pilek", "Sakit perut", "Sakit gigi"];
  const ALASAN_I = ["Acara keluarga", "Ke luar kota bersama orang tua", "Keperluan keluarga"];
  for (let d = taAktif.tglMulai; d <= hari; d = tambahHari(d, 1)) {
    if (!hariSekolah(d, kalender)) continue;
    rombelAktif.forEach((r, ri) => {
      // Hari ini: sebagian kelas sudah absen, 4A belum (untuk dicoba wali kelas).
      if (d === hari && (r.id === rombel4A.id || ri % 2 === 1)) return;
      const status: Record<string, StatusPresensi> = {};
      const keterangan: Record<string, string> = {};
      for (const k of keanggotaan.filter((x) => x.rombelId === r.id)) {
        const p = acak() / kecenderungan.get(k.siswaId)!;
        const st: StatusPresensi = p > 0.065 ? "H" : p > 0.035 ? "S" : p > 0.012 ? "I" : "A";
        status[k.id] = st;
        if (st === "S") keterangan[k.id] = pilih(ALASAN_S);
        if (st === "I") keterangan[k.id] = pilih(ALASAN_I);
      }
      presensi.push({
        id: `pr_${r.nama}_${d.replaceAll("-", "")}`,
        rombelId: r.id,
        tanggal: d,
        semester: d >= `${y + 1}-01-01` ? 2 : 1,
        dicatatOleh: `pgn_${r.waliKelasGuruId}`,
        status,
        keterangan,
      });
    });
  }

  // ---------- jurnal (10 hari sekolah terakhir sebelum hari ini) ----------
  const hariJurnal: string[] = [];
  for (let d = tambahHari(hari, -1); hariJurnal.length < 10 && d >= taAktif.tglMulai; d = tambahHari(d, -1)) {
    if (hariSekolah(d, kalender)) hariJurnal.unshift(d);
  }
  const jurnal: Jurnal[] = [];
  const pengampuAktif = pengampu.filter((p) => p.tahunAjaranId === taAktif.id);
  hariJurnal.forEach((d, di) => {
    for (const r of rombelAktif) {
      const milikWali = pengampuAktif.filter(
        (p) => p.rombelId === r.id && p.guruId === r.waliKelasGuruId && MATERI[p.mapelId],
      );
      const pjok = pengampuAktif.find((p) => p.rombelId === r.id && p.mapelId === "mp_pjok")!;
      const dipakai = [milikWali[di % milikWali.length], milikWali[(di + 2) % milikWali.length]];
      if ((di + r.tingkat) % 3 === 0) dipakai.push(pjok);
      dipakai.forEach((p, i) => {
        const terbaru = di >= hariJurnal.length - 2;
        const diperiksa = !terbaru && acak() < 0.7;
        jurnal.push({
          id: `jr_${r.nama}_${d.replaceAll("-", "")}_${i}`,
          pengampuId: p.id,
          tanggal: d,
          jamKe: i === 0 ? [1, 2] : i === 1 ? [3, 4] : [5, 6],
          materi: pilih(MATERI[p.mapelId]),
          tujuanPembelajaran: "Peserta didik mampu memahami dan menerapkan materi yang dipelajari.",
          kegiatan: "Apersepsi, diskusi kelompok, presentasi hasil, dan refleksi bersama.",
          kendala: acak() < 0.2 ? "Beberapa siswa masih perlu pendampingan tambahan." : "",
          status: diperiksa ? "diperiksa" : "dikirim",
          catatanKepsek: diperiksa && acak() < 0.3 ? "Bagus, pertahankan variasi metode pembelajaran." : "",
        });
      });
    }
  });

  // ---------- pengumuman ----------
  const pengumuman: Pengumuman[] = [
    {
      id: "pg_1",
      judul: "Peringatan Hari Guru Nasional",
      isi: "Dalam rangka memperingati Hari Guru Nasional, akan diadakan upacara bersama pada pukul 07.15 WITA. Seluruh siswa memakai seragam batik.",
      target: "semua",
      rombelIds: [],
      penulisId: `pgn_${kepsek.id}`,
      tanggal: tambahHari(hari, -1),
      disematkan: true,
    },
    {
      id: "pg_2",
      judul: "Rapat Dinas Guru Bulan Ini",
      isi: "Rapat dinas seluruh guru dilaksanakan hari Sabtu setelah jam pelajaran selesai di ruang guru. Agenda: evaluasi pembelajaran dan persiapan SAS.",
      target: "guru",
      rombelIds: [],
      penulisId: `pgn_${kepsek.id}`,
      tanggal: tambahHari(hari, -2),
      disematkan: false,
    },
    {
      id: "pg_3",
      judul: "Pengumpulan Modul Ajar Semester Ganjil",
      isi: "Bapak/Ibu guru dimohon mengunggah modul ajar semester ganjil paling lambat akhir bulan ini.",
      target: "guru",
      rombelIds: [],
      penulisId: "pgn_admin",
      tanggal: tambahHari(hari, -4),
      disematkan: false,
    },
    {
      id: "pg_4",
      judul: "Kegiatan Jumat Bersih dan Sehat",
      isi: "Setiap hari Jumat siswa membawa alat kebersihan sesuai jadwal piket kelas. Mohon dukungan Bapak/Ibu orang tua.",
      target: "ortu",
      rombelIds: [],
      penulisId: "pgn_admin",
      tanggal: tambahHari(hari, -6),
      disematkan: false,
    },
    {
      id: "pg_5",
      judul: "Kelas 4A: Membawa Alat Gambar",
      isi: "Untuk pelajaran Seni Rupa minggu ini, ananda dimohon membawa buku gambar dan pensil warna.",
      target: "ortu",
      rombelIds: [rombel4A.id],
      penulisId: `pgn_${rombel4A.waliKelasGuruId}`,
      tanggal: tambahHari(hari, -3),
      disematkan: false,
    },
  ];

  return {
    sekolah: [
      {
        id: "sekolah",
        nama: "Sekolah Azzahra",
        npsn: "50200000",
        alamat: "Jl. Pendidikan No. 1 (alamat contoh)",
        kecamatan: "Sumbawa",
        kabupaten: "Sumbawa",
        provinsi: "Nusa Tenggara Barat",
        telepon: "(0371) 000000",
        email: "info@azzahra.sch.id",
        kepsekGuruId: kepsek.id,
      },
    ],
    tahunAjaran: [taLalu, taAktif],
    pengguna,
    guru,
    siswa,
    ortu,
    mapel: MAPEL,
    rombel: [...rombelLalu, ...rombelAktif],
    keanggotaanKelas: keanggotaan,
    pengampu,
    kalender,
    presensi,
    jurnal,
    pengumuman,
  };
}
