"use client";

import { useActionState } from "react";
import { osnuj, udji, type StanjeForme } from "@/app/akcije";

const POCETNO: StanjeForme = { greska: null };

export function OsnujLigu() {
  const [stanje, akcija, ceka] = useActionState(osnuj, POCETNO);
  return (
    <form action={akcija} className="obrazac">
      <div className="polje">
        <label htmlFor="naziv">Naziv nove lige</label>
        <input type="text" id="naziv" name="naziv" maxLength={30} autoComplete="off" placeholder="Ured, treći kat" required />
      </div>
      {stanje.greska ? (
        <p className="greska" role="alert">
          {stanje.greska}
        </p>
      ) : null}
      <button className="tipka" type="submit" disabled={ceka}>
        {ceka ? "Osnivam" : "Osnuj ligu"}
      </button>
    </form>
  );
}

/** Ako je kod zadan (stranica lige), prikazuje se samo gumb; inače i polje za upis koda. */
export function UdjiULigu({ kod }: { kod?: string }) {
  const [stanje, akcija, ceka] = useActionState(udji, POCETNO);
  return (
    <form action={akcija} className="obrazac">
      {kod ? (
        <input type="hidden" name="kod" value={kod} />
      ) : (
        <div className="polje">
          <label htmlFor="kod">Kod lige koji ti je netko poslao</label>
          <input type="text" id="kod" name="kod" maxLength={6} autoComplete="off" autoCapitalize="none" placeholder="abc234" required />
        </div>
      )}
      {stanje.greska ? (
        <p className="greska" role="alert">
          {stanje.greska}
        </p>
      ) : null}
      <button className="tipka" type="submit" disabled={ceka}>
        {ceka ? "Ulazim" : "Uđi u ligu"}
      </button>
    </form>
  );
}
