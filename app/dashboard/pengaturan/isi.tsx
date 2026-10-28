"use client";

import { useState } from "react";
import { Database, RotateCcw, Save, School } from "lucide-react";
import { LogoPenuh } from "@/components/logo";
import { IkonBulat, Input, Isian, JudulHalaman, Kartu, Konfirmasi, Pilihan, Tombol, useToast } from "@/components/ui";
import { resetDataDemo, ubah, ukuranPenyimpanan, useKoleksi } from "@/lib/db/store";
import type { Sekolah } from "@/lib/db/types";
import { digit, email, wajib } from "@/lib/validasi";

export function IsiPengaturan() {
  const sekolah = useKoleksi("sekolah")[0];
  const guru = useKoleksi("guru");
  // Ukuran dihitung ulang setiap render karena koleksi di atas ikut berubah.
  const ukuran = ukuranPenyimpanan();
  const [konfirmReset, setKonfirmReset] = useState(false);
  const toast = useToast();

  return (
    <>
      <JudulHalaman judul="Pengaturan" sub="Identitas sekolah dan data demo" />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {sekolah && <FormSekolah key={JSON.stringify(sekolah)} awal={sekolah} guru={guru} />}
        <div className="flex flex-col gap-5">
          <Kartu className="p-6">
            <div className="flex items-center gap-4">
              <LogoPenuh lebar={96} />
              <div>
                <p className="font-display font-bold">Logo sekolah</p>
                <p className="text-xs text-redup">Dipakai di aplikasi, layar memuat, dan ikon tab browser.</p>
              </div>
            </div>
          </Kartu>
          <Kartu nada="coral" className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <IkonBulat ikon={Database} nada="coral" />
              <div>
                <p className="font-display font-bold">Data Demo</p>
                <p className="text-xs text-tinta-2">Semua data prototipe tersimpan di browser ini (localStorage).</p>
              </div>
            </div>
            <div className="mb-4 rounded-2xl bg-permukaan/80 p-3 text-sm">
              <div className="mb-1 flex justify-between">
                <span>Terpakai</span>
                <b>{(ukuran / 1024 / 1024).toFixed(2)} MB dari ±5 MB</b>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-krem-tua">
                <div className="h-full rounded-full bg-coral" style={{ width: `${Math.min(100, (ukuran / (5 * 1024 * 1024)) * 100)}%` }} />
              </div>
            </div>
            <p className="mb-4 text-sm text-tinta-2">
              Reset mengembalikan semua data ke kondisi awal: perubahan, siswa, dan absensi yang Anda tambahkan akan hilang.
            </p>
            <Tombol varian="bahaya" ikon={RotateCcw} onClick={() => setKonfirmReset(true)}>
              Reset Data Demo
            </Tombol>
          </Kartu>
        </div>
      </div>
      <Konfirmasi
        buka={konfirmReset}
        tutup={() => setKonfirmReset(false)}
        judul="Reset semua data demo?"
        pesan="Semua perubahan di browser ini akan dihapus dan diganti data contoh awal. Anda akan tetap masuk."
        labelYa="Ya, reset"
        onYa={() => {
          resetDataDemo();
          toast("Data demo dikembalikan ke kondisi awal.");
        }}
      />
    </>
  );
}

function FormSekolah({ awal, guru }: { awal: Sekolah; guru: { id: string; nama: string; aktif: boolean }[] }) {
  const toast = useToast();
  const [d, setD] = useState(awal);
  const [galat, setGalat] = useState<Partial<Record<keyof Sekolah, string>>>({});
  const set = <K extends keyof Sekolah>(k: K, v: Sekolah[K]) => {
    setD({ ...d, [k]: v });
    setGalat({ ...galat, [k]: undefined });
  };

  function simpan() {
    const g = { nama: wajib(d.nama, "Nama sekolah"), npsn: digit(d.npsn, 8, "NPSN"), email: email(d.email) };
    if (g.nama || g.npsn || g.email) {
      setGalat(g);
      return;
    }
    ubah("sekolah", "sekolah", d);
    toast("Identitas sekolah disimpan.");
  }

  return (
    <Kartu className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <IkonBulat ikon={School} nada="sage" />
        <div>
          <p className="font-display text-lg font-bold">Identitas Sekolah</p>
          <p className="text-xs text-redup">Dipakai pada kop rapor dan laporan.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Isian label="Nama sekolah" wajib galat={galat.nama} className="sm:col-span-2">
          {(id) => <Input id={id} value={d.nama} onChange={(e) => set("nama", e.target.value)} />}
        </Isian>
        <Isian label="NPSN" wajib galat={galat.npsn} bantuan="8 digit">
          {(id) => <Input id={id} inputMode="numeric" maxLength={8} value={d.npsn} onChange={(e) => set("npsn", e.target.value.replace(/\D/g, ""))} />}
        </Isian>
        <Isian label="Kepala sekolah">
          {(id) => (
            <Pilihan id={id} value={d.kepsekGuruId ?? ""} onChange={(e) => set("kepsekGuruId", e.target.value || null)}>
              <option value="">—</option>
              {guru
                .filter((g) => g.aktif)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
            </Pilihan>
          )}
        </Isian>
        <Isian label="Alamat" className="sm:col-span-2">
          {(id) => <Input id={id} value={d.alamat} onChange={(e) => set("alamat", e.target.value)} />}
        </Isian>
        <Isian label="Kecamatan">{(id) => <Input id={id} value={d.kecamatan} onChange={(e) => set("kecamatan", e.target.value)} />}</Isian>
        <Isian label="Kabupaten">{(id) => <Input id={id} value={d.kabupaten} onChange={(e) => set("kabupaten", e.target.value)} />}</Isian>
        <Isian label="Provinsi">{(id) => <Input id={id} value={d.provinsi} onChange={(e) => set("provinsi", e.target.value)} />}</Isian>
        <Isian label="Telepon">{(id) => <Input id={id} value={d.telepon} onChange={(e) => set("telepon", e.target.value)} />}</Isian>
        <Isian label="Email" galat={galat.email} className="sm:col-span-2">
          {(id) => <Input id={id} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} />}
        </Isian>
      </div>
      <Tombol ikon={Save} className="mt-6" onClick={simpan}>
        Simpan
      </Tombol>
    </Kartu>
  );
}
