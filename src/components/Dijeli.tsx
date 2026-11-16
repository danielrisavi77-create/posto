"use client";

import { useState } from "react";

export function Dijeli({ tekst, link }: { tekst: string; link: string }) {
  const [poruka, setPoruka] = useState("");
  const puno = `${tekst}\n${link}`;

  async function podijeli() {
    // Web Share otvara izbornik aplikacija na mobitelu; ako ga nema ili korisnik odustane, kopiramo.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: puno });
        return;
      } catch {
        /* korisnik je zatvorio izbornik ili preglednik ne dopušta: nastavi na kopiranje */
      }
    }
    try {
      await navigator.clipboard.writeText(puno);
      setPoruka("Kopirano. Zalijepi u grupu.");
    } catch {
      setPoruka("Kopiranje nije uspjelo. Označi tekst i kopiraj ga ručno.");
    }
  }

  return (
    <section className="kartica dijeli">
      <h3 className="naslov-bloka">Izazovi ekipu</h3>
      <pre>{puno}</pre>
      <div className="gumbi">
        <a className="gumb wa" href={`https://wa.me/?text=${encodeURIComponent(puno)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <button className="gumb crveni mali" onClick={podijeli}>
          Podijeli
        </button>
      </div>
      <p className="opis">Tko otvori tvoj link, igra dvoboj baš protiv tebe.</p>
      <p className="kopirano" role="status">
        {poruka}
      </p>
    </section>
  );
}
