import { cx } from "./ui";

// Grafik sederhana tanpa pustaka tambahan, mengikuti gaya "pil" pada desain referensi.

const WARNA_BATANG = ["bg-coral", "bg-mustard", "bg-sage", "bg-langit", "bg-lavender", "bg-coral/70"];

export function GrafikBatang({
  data,
  satuan = "%",
  maks = 100,
}: {
  data: { label: string; nilai: number | null; sub?: string; sorot?: boolean }[];
  satuan?: string;
  maks?: number;
}) {
  return (
    <div className="flex h-60 items-end gap-3 border-b border-garis px-1 pb-0 sm:gap-5">
      {data.map((d, i) => {
        const tinggi = d.nilai === null ? 0 : Math.max(6, (d.nilai / maks) * 100);
        return (
          <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className={cx("text-xs font-bold", d.nilai === null ? "text-redup/60" : "text-tinta-2")}>
              {d.nilai === null ? "–" : `${Math.round(d.nilai)}${satuan}`}
            </span>
            <div className="flex w-full max-w-12 flex-1 items-end">
              <div
                className={cx(
                  "w-full rounded-full transition-all duration-500",
                  d.nilai === null ? "h-3 bg-krem-tua" : WARNA_BATANG[i % WARNA_BATANG.length],
                  d.sorot && "ring-4 ring-coral-muda",
                )}
                style={{
                  height: d.nilai === null ? undefined : `${tinggi}%`,
                  boxShadow: d.nilai === null ? undefined : "inset 3px 3px 5px rgb(255 255 255 / .35), inset -3px -4px 6px rgb(0 0 0 / .08), 4px 6px 12px rgb(150 110 90 / .18)",
                }}
                title={d.sub}
              />
            </div>
            <span className={cx("pb-2 text-xs font-bold", d.sorot ? "text-coral-tua" : "text-tinta-2")}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Donat({
  bagian,
  tengah,
  subTengah,
}: {
  bagian: { label: string; nilai: number; warna: string }[];
  tengah: string;
  subTengah: string;
}) {
  const total = bagian.reduce((a, b) => a + b.nilai, 0);
  const r = 15.915; // keliling ≈ 100
  let offset = 25;
  return (
    <div className="relative size-44 shrink-0">
      <svg viewBox="0 0 42 42" className="size-full -rotate-0">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--color-krem-tua)" strokeWidth="6" />
        {total > 0 &&
          bagian.map((b) => {
            const pct = (b.nilai / total) * 100;
            const el = (
              <circle
                key={b.label}
                cx="21"
                cy="21"
                r={r}
                fill="none"
                stroke={b.warna}
                strokeWidth="6"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={offset}
              />
            );
            offset -= pct;
            return el;
          })}
      </svg>
      <div className="absolute inset-[22%] grid place-items-center rounded-full bg-permukaan shadow-[inset_3px_3px_6px_rgb(150_120_95/0.15),inset_-3px_-3px_6px_white]">
        <div className="text-center">
          <p className="font-display text-2xl font-bold">{tengah}</p>
          <p className="text-[11px] font-semibold text-redup">{subTengah}</p>
        </div>
      </div>
    </div>
  );
}

export const WARNA_STATUS = {
  H: "var(--color-sage)",
  S: "var(--color-mustard)",
  I: "var(--color-langit)",
  A: "var(--color-coral)",
} as const;
