"use client";

import { useState } from "react";

export function Dijeli({ naslov, tekst, link, napomena }: { naslov: string; tekst: string; link: string; napomena?: string }) {
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
    <section className="na-stolu" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 className="naslov">{naslov}</h2>
      <pre className="poruka">{puno}</pre>
      <div className="dvije">
        <a className="tipka zelena" href={`https://wa.me/?text=${encodeURIComponent(puno)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <button className="tipka" onClick={podijeli}>
          Podijeli
        </button>
      </div>
      {napomena ? <p className="napomena">{napomena}</p> : null}
      <p className="status" role="status">
        {poruka}
      </p>
    </section>
  );
}
