"use client";

import { useActionState } from "react";
import { kreni, type StanjeForme } from "@/app/akcije";
import { ZUPANIJE } from "@/lib/zupanije";

const POCETNO: StanjeForme = { greska: null };

export function PocetnaForma({ zupanija, nadimak }: { zupanija: string; nadimak: string }) {
  const [stanje, akcija, ceka] = useActionState(kreni, POCETNO);
  return (
    <form action={akcija} className="kartica">
      <div className="polje">
        <label htmlFor="zupanija">Za koga igraš</label>
        <select id="zupanija" name="zupanija" defaultValue={zupanija} required>
          <option value="">Odaberi županiju</option>
          {ZUPANIJE.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
      <div className="polje">
        <label htmlFor="nadimak">Nadimak (nije obavezno)</label>
        <input type="text" id="nadimak" name="nadimak" maxLength={16} autoComplete="off" placeholder="npr. Kralj akcija" defaultValue={nadimak} />
      </div>
      {stanje.greska ? (
        <p className="greska" role="alert">
          {stanje.greska}
        </p>
      ) : null}
      <button className="gumb crveni" type="submit" disabled={ceka}>
        {ceka ? "Otvaram račun" : "Plati današnjim cijenama"}
      </button>
      <p className="opis">Četiri cijene i jedno pitanje s druge strane računa. Igraš dvoboj protiv kupca iz druge županije.</p>
    </form>
  );
}
