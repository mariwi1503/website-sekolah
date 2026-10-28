import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Kartu, Tombol } from "./ui";

// Penanda modul yang dijadwalkan di tahap berikutnya.
export function Segera({ judul, tahap, poin }: { judul: string; tahap: string; poin: string[] }) {
  return (
    <Kartu className="mx-auto max-w-2xl p-8 text-center sm:p-12">
      <span className="clay-sm mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-lavender text-white">
        <Sparkles size={28} />
      </span>
      <p className="text-sm font-bold text-lavender-tua">{tahap}</p>
      <h1 className="mt-1 text-3xl font-bold">{judul}</h1>
      <p className="mt-3 text-tinta-2">Modul ini sedang disiapkan. Rencana fiturnya:</p>
      <ul className="mx-auto mt-4 flex max-w-md flex-col gap-2 text-left text-sm">
        {poin.map((p) => (
          <li key={p} className="rounded-2xl bg-krem/80 px-4 py-2.5">
            {p}
          </li>
        ))}
      </ul>
      <Link href="/dashboard" className="mt-6 inline-block">
        <Tombol varian="kedua">Kembali ke Dashboard</Tombol>
      </Link>
    </Kartu>
  );
}
