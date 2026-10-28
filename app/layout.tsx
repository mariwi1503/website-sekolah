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
    default: "SDN 16 Sumbawa",
    template: "%s · SDN 16 Sumbawa",
  },
  description: "Sistem informasi sekolah SD Negeri 16 Sumbawa untuk guru, orang tua, dan siswa.",
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
