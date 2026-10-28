// Skema data prototipe Sekolah Azzahra. Setiap koleksi disimpan di localStorage
// sebagai array JSON. Data harian merujuk ke `KeanggotaanKelas` (bukan langsung ke
// siswa) supaya riwayat per tahun ajaran tetap utuh setelah kenaikan kelas.

export type Peran = "admin" | "kepsek" | "guru" | "ortu" | "siswa";
export type JenisKelamin = "L" | "P";
export type StatusPresensi = "H" | "S" | "I" | "A";

export interface Sekolah {
  id: "sekolah";
  nama: string;
  npsn: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  telepon: string;
  email: string;
  kepsekGuruId: string | null;
}

export interface TahunAjaran {
  id: string;
  nama: string; // "2026/2027"
  semesterAktif: 1 | 2;
  tglMulai: string; // YYYY-MM-DD
  tglSelesai: string;
  status: "aktif" | "ditutup";
}

export interface Pengguna {
  id: string;
  username: string;
  password: string; // hanya untuk demo, jangan dipakai di produksi
  nama: string;
  peran: Peran[];
  guruId?: string;
  ortuId?: string;
  siswaId?: string;
}

export interface Guru {
  id: string;
  nama: string;
  nip: string;
  nuptk: string;
  jk: JenisKelamin;
  tempatLahir: string;
  tglLahir: string;
  hp: string;
  email: string;
  jabatan: string;
  statusKepegawaian: "PNS" | "PPPK" | "Honorer";
  aktif: boolean;
}

export type StatusSiswa = "aktif" | "lulus" | "pindah" | "keluar";

export interface Siswa {
  id: string;
  nisn: string;
  nis: string;
  nik: string;
  nama: string;
  jk: JenisKelamin;
  tempatLahir: string;
  tglLahir: string;
  agama: string;
  alamat: string;
  tglMasuk: string;
  status: StatusSiswa;
}

export interface Ortu {
  id: string;
  nama: string;
  hubungan: "Ayah" | "Ibu" | "Wali";
  hp: string;
  pekerjaan: string;
  siswaIds: string[];
}

export interface Mapel {
  id: string;
  kode: string;
  nama: string;
  kelompok: "Umum" | "Muatan Lokal";
  tingkatBerlaku: number[];
}

export interface Rombel {
  id: string;
  tahunAjaranId: string;
  tingkat: number; // 1–6
  nama: string; // "4A"
  waliKelasGuruId: string | null;
}

export type StatusKeanggotaan = "aktif" | "naik" | "tinggal" | "lulus" | "pindah";

export interface KeanggotaanKelas {
  id: string;
  siswaId: string;
  rombelId: string;
  tahunAjaranId: string;
  noAbsen: number;
  statusAkhir: StatusKeanggotaan;
}

export interface Pengampu {
  id: string;
  tahunAjaranId: string;
  rombelId: string;
  mapelId: string;
  guruId: string;
}

export interface Kalender {
  id: string;
  judul: string;
  tglMulai: string;
  tglSelesai: string;
  jenis: "libur" | "ujian" | "kegiatan";
}

export interface Presensi {
  id: string;
  rombelId: string;
  tanggal: string;
  semester: 1 | 2;
  dicatatOleh: string; // penggunaId
  status: Record<string, StatusPresensi>; // keanggotaanId → status
  keterangan: Record<string, string>;
}

export interface Jurnal {
  id: string;
  pengampuId: string;
  tanggal: string;
  jamKe: number[];
  materi: string;
  tujuanPembelajaran: string;
  kegiatan: string;
  kendala: string;
  status: "draf" | "dikirim" | "diperiksa";
  catatanKepsek: string;
}

export type TargetPengumuman = "semua" | "guru" | "ortu";

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  target: TargetPengumuman;
  rombelIds: string[]; // kosong = tidak dibatasi rombel
  penulisId: string;
  tanggal: string;
  disematkan: boolean;
}

export interface Koleksi {
  sekolah: Sekolah;
  tahunAjaran: TahunAjaran;
  pengguna: Pengguna;
  guru: Guru;
  siswa: Siswa;
  ortu: Ortu;
  mapel: Mapel;
  rombel: Rombel;
  keanggotaanKelas: KeanggotaanKelas;
  pengampu: Pengampu;
  kalender: Kalender;
  presensi: Presensi;
  jurnal: Jurnal;
  pengumuman: Pengumuman;
}

export type NamaKoleksi = keyof Koleksi;
