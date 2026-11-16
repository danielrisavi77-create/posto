"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upisiKupca } from "@/app/akcije";
import { ZUPANIJE } from "@/lib/zupanije";

/** Neobavezan upis nakon igre: nadimak za ljestvicu i županija za ligu županija. */
export function KupacForma({ nadimak, zupanija }: { nadimak: string; zupanija: string }) {
  const router = useRouter();
  const [n, setN] = useState(nadimak);
  const [z, setZ] = useState(zupanija);
  const [greska, setGreska] = useState<string | null>(null);
  const [ceka, startTransition] = useTransition();

  function spremi() {
    setGreska(null);
    startTransition(async () => {
      try {
        const r = await upisiKupca(z, n);
        if ("greska" in r) setGreska(r.greska);
        else router.refresh();
      } catch {
        setGreska("Veza je pukla. Provjeri internet pa pokušaj ponovno.");
      }
    });
  }

  return (
    <section className="na-stolu obrazac" aria-label="Upis na ljestvicu">
      <div>
        <h2 className="podnaslov">Želiš na ljestvicu?</h2>
        <p className="napomena">Nije obavezno. Bez nadimka si na ljestvici Anonimni kupac, a županija ti treba samo za ligu županija.</p>
      </div>
      <div className="polje">
        <label htmlFor="nadimak">Nadimak</label>
        <input type="text" id="nadimak" maxLength={16} autoComplete="off" placeholder="Kralj akcija" value={n} onChange={(e) => setN(e.target.value)} />
      </div>
      {!zupanija ? (
        <div className="polje">
          <label htmlFor="zupanija">Županija (ako želiš igrati za svoju)</label>
          <select id="zupanija" value={z} onChange={(e) => setZ(e.target.value)}>
            <option value="">bez županije</option>
            {ZUPANIJE.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {greska ? (
        <p className="greska" role="alert">
          {greska}
        </p>
      ) : null}
      <button type="button" className="tipka" onClick={spremi} disabled={ceka || (!n.trim() && !z)}>
        {ceka ? "Upisujem" : "Upiši me"}
      </button>
    </section>
  );
}
