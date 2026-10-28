import { Suspense } from "react";
import { Gerbang } from "@/components/gerbang";
import { Kerangka } from "@/components/shell";

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  return (
    <Gerbang peran={["admin", "kepsek", "guru"]}>
      <Kerangka>
        <Suspense>{children}</Suspense>
      </Kerangka>
    </Gerbang>
  );
}
