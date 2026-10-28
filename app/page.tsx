import { redirect } from "next/navigation";

// Website publik sekolah dibangun di tahap berikutnya; sementara langsung ke halaman masuk.
export default function Beranda() {
  redirect("/login");
}
