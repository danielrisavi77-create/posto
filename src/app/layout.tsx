import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ZvukGumb } from "@/components/ZvukGumb";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.POSTO_SITE_URL ?? "http://localhost:3000"),
  title: "Pošto?",
  description: "Svaki dan jedan stari račun u kunama. Pogodi koliko iste stvari koštaju danas i izazovi drugu županiju.",
  openGraph: {
    title: "Pošto?",
    description: "Stari račun u kunama. Pošto je to danas?",
    locale: "hr_HR",
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#E6ECE1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600..900;1,600..900&family=Instrument+Sans:wght@400..700&display=swap"
          rel="stylesheet"
        />
        {/* Vinjete: bolje kratko prazno mjesto nego šareni sistemski emoji dok se font ne učita. */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Emoji:wght@400&display=block" rel="stylesheet" />
      </head>
      <body>
        <main id="app">
          {children}
          <footer className="podnozje">
            <p>
              Koristimo samo kolačiće nužne za igru. <Link href="/privatnost">Privatnost</Link>. Cijene: <Link href="/izvori">izvori i metoda</Link>.
            </p>
            <ZvukGumb />
          </footer>
        </main>
      </body>
    </html>
  );
}
