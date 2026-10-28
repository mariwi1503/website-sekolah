import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import { PenyediaToast } from "@/components/ui";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Sekolah Azzahra",
    template: "%s · Sekolah Azzahra",
  },
  description: "Sistem informasi Sekolah Azzahra untuk guru, orang tua, dan siswa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${nunito.variable} ${quicksand.variable} h-full antialiased`}>
      <body className="min-h-full">
        <PenyediaToast>{children}</PenyediaToast>
      </body>
    </html>
  );
}
