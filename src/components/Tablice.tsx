"use client";

import { useState } from "react";

export type RedTabliceUI = { mj: number; ime: string; dodatak?: string; vrijednost: string; moj?: boolean };
export type KarticaTablice = { id: string; naziv: string; stupac: string; vrijednost: string; redovi: RedTabliceUI[]; prazno: string; opis?: string };

/** Novinska tablica s karticama. Redovi su već poredani; preskok u rednim brojevima crta se kao razmak. */
export function Tablice({ naslov, kartice }: { naslov: string; kartice: KarticaTablice[] }) {
  const [aktivna, setAktivna] = useState(kartice[0]?.id);
  const k = kartice.find((x) => x.id === aktivna) ?? kartice[0];
  if (!k) return null;
  return (
    <section className="izrezak">
      <h2>{naslov}</h2>
      {kartice.length > 1 ? (
        <div className="kartice" role="tablist">
          {kartice.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={x.id === k.id} onClick={() => setAktivna(x.id)}>
              {x.naziv}
            </button>
          ))}
        </div>
      ) : null}
      {k.opis ? <p className="pod">{k.opis}</p> : null}
      {k.redovi.length ? (
        <table className="tablica">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{k.stupac}</th>
              <th scope="col" className="br">
                {k.vrijednost}
              </th>
            </tr>
          </thead>
          <tbody>
            {k.redovi.flatMap((r, i) => {
              const red = (
                <tr key={`${r.mj}-${r.ime}-${i}`} className={r.moj ? "moj" : undefined}>
                  <td>{r.mj}.</td>
                  <td>
                    <span>{r.ime}</span>
                    {r.dodatak ? <small> {r.dodatak}</small> : null}
                  </td>
                  <td className="br">{r.vrijednost}</td>
                </tr>
              );
              const preskok = i > 0 && r.mj - k.redovi[i - 1].mj > 1;
              return preskok
                ? [
                    <tr key={`razmak-${i}`} className="razmak" aria-hidden="true">
                      <td colSpan={3}>...</td>
                    </tr>,
                    red,
                  ]
                : [red];
            })}
          </tbody>
        </table>
      ) : (
        <p className="prazno">{k.prazno}</p>
      )}
    </section>
  );
}
