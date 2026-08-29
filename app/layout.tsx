import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-fraunces", display: "swap" });
const workSans = Work_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-work-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Odwiedziny u Zoi",
  description: "Rezerwacja pierwszych odwiedzin u naszej córki Zoi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${fraunces.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
