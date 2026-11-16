// SAMO SERVER. Osobna statistika i Veliki račun sezone.
import { osjecaj, tipKupca, zbroj } from "./bodovanje";
import type { Igra } from "./pohrana";
import { racunIgre } from "./racuni";

export type Knjizica = {
  igara: number;
  prosjek: number;
  najbolji: number;
  /** uzastopni dani zaključno s danas (ili jučer, ako danas još nije odigrano) */
  niz: number;
  najduziNiz: number;
  /** najčešći tip kupca */
  tip: string | null;
  uCent: number;
};

export function knjizica(igre: Igra[], danas: number): Knjizica {
  if (!igre.length) return { igara: 0, prosjek: 0, najbolji: 0, niz: 0, najduziNiz: 0, tip: null, uCent: 0 };
  const dani = new Set(igre.map((g) => g.dan));
  let niz = 0;
  for (let d = dani.has(danas) ? danas : danas - 1; dani.has(d); d--) niz++;
  let najduzi = 0;
  let tekuci = 0;
  let prosli = -10;
  for (const d of [...dani].sort((a, b) => a - b)) {
    tekuci = d === prosli + 1 ? tekuci + 1 : 1;
    najduzi = Math.max(najduzi, tekuci);
    prosli = d;
  }
  const tipovi = new Map<string, number>();
  let uCent = 0;
  for (const g of igre) {
    const r = racunIgre(g);
    const o = osjecaj(r.stavke.map((s) => s.st), r.stavke.map((s) => s.c), g.pogodci);
    const t = tipKupca(o).ime;
    tipovi.set(t, (tipovi.get(t) ?? 0) + 1);
    uCent += g.bodovi.filter((b) => b >= 90).length;
  }
  const tip = [...tipovi].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    igara: igre.length,
    prosjek: Math.round(zbroj(igre.map((g) => g.ukupno)) / igre.length),
    najbolji: Math.max(...igre.map((g) => g.ukupno)),
    niz,
    najduziNiz: najduzi,
    tip,
    uCent,
  };
}

export type RedVelikog = { dan: number; naslov: string; ukupno: number; staro: number; novo: number; moje: number };
export type VelikiRacun = { redovi: RedVelikog[]; staro: number; novo: number; moje: number; ti: number; stvarno: number; bodovi: number };

/** Sve košarice sezone zbrojene u jedan račun: koliko je sve skupa koštalo nekad, koliko danas, a koliko po igraču. */
export function velikiRacun(igre: Igra[], sezona: string): VelikiRacun {
  const redovi = igre
    .filter((g) => g.sezona === sezona)
    .map((g) => {
      const r = racunIgre(g);
      const o = osjecaj(r.stavke.map((s) => s.st), r.stavke.map((s) => s.c), g.pogodci);
      return { dan: g.dan, naslov: r.naslov, ukupno: g.ukupno, staro: o.staro, novo: o.novo, moje: o.moje };
    });
  const staro = zbroj(redovi.map((r) => r.staro));
  const novo = zbroj(redovi.map((r) => r.novo));
  const moje = zbroj(redovi.map((r) => r.moje));
  return {
    redovi, staro, novo, moje,
    ti: staro ? moje / staro - 1 : 0,
    stvarno: staro ? novo / staro - 1 : 0,
    bodovi: zbroj(redovi.map((r) => r.ukupno)),
  };
}
