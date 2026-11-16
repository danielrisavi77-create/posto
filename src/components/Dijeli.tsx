"use client";

import { useState } from "react";

type Props = { naslov: string; tekst: string; link: string; napomena?: string; slika?: string };

/** Dijeljenje: slika računa kad uređaj to podržava, inače tekst s linkom. WhatsApp gumb uvijek šalje tekst i link. */
export function Dijeli({ naslov, tekst, link, napomena, slika }: Props) {
  const [poruka, setPoruka] = useState("");
  const [radi, setRadi] = useState(false);
  const puno = `${tekst}\n${link}`;

  async function podijeli() {
    if (radi) return;
    setRadi(true);
    try {
      if (slika && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try {
          const odgovor = await fetch(slika);
          if (odgovor.ok) {
            const datoteka = new File([await odgovor.blob()], "posto-racun.png", { type: "image/png" });
            if (navigator.canShare({ files: [datoteka] })) {
              await navigator.share({ files: [datoteka], text: puno });
              return;
            }
          }
        } catch (e) {
          // Korisnik je zatvorio izbornik: ne nudimo mu odmah drugi.
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      }
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ text: puno });
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(puno);
        setPoruka("Kopirano. Zalijepi u grupu.");
      } catch {
        setPoruka("Kopiranje nije uspjelo. Označi tekst i kopiraj ga ručno.");
      }
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="na-stolu" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 className="naslov">{naslov}</h2>
      {slika ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="slika-racuna" src={slika} alt="Slika tvog računa za dijeljenje, bez današnjih cijena" width={1080} height={1350} />
      ) : null}
      <pre className="poruka">{puno}</pre>
      <div className="dvije">
        <a className="tipka zelena" href={`https://wa.me/?text=${encodeURIComponent(puno)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <button className="tipka" onClick={podijeli} disabled={radi}>
          {slika ? "Podijeli sliku" : "Podijeli"}
        </button>
      </div>
      {slika ? (
        <a className="veza" href={slika} download="posto-racun.png">
          Spremi sliku računa
        </a>
      ) : null}
      {napomena ? <p className="napomena">{napomena}</p> : null}
      <p className="status" role="status">
        {poruka}
      </p>
    </section>
  );
}
