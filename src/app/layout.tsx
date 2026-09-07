import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import Script from "next/script";
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
      <body>
        {children}

        {/*
          UMAMI — statystyki odwiedzin.

          W layoucie, a nie na pojedynczej stronie: apka ma pięć tras
          (/, /admin, /decision, /cancel, 404) i licznik ma obejmować wszystkie.

          next/script zamiast gołego znacznika, bo Next sam pilnuje, żeby przy
          nawigacji między trasami skrypt nie został wstrzyknięty drugi raz.
          Strategia lazyOnload odkłada go za pierwsze malowanie — kalendarz ma
          się pojawić przed licznikiem, nie odwrotnie.

          Identyfikator strony jest publiczny: i tak wychodzi w każdym żądaniu
          z przeglądarki gościa. Umami nie stawia ciasteczek i nie zbiera
          danych osobowych, więc nie zmienia tego, co obiecujemy w formularzu.
        */}
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="866d97c1-1cf0-479f-8cd4-978b4109c5de"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
