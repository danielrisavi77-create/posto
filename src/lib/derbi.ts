// SAMO SERVER. Derbi dana: svaki dan dvije županije igraju jedna protiv druge.
import { pohrana, type RedLige } from "./pohrana";

// Susjedi i stari rivali. Svaka županija se pojavljuje barem jednom; popis se vrti po danima.
const PAROVI: [string, string][] = [
  ["Splitsko-dalmatinska", "Grad Zagreb"],
  ["Osječko-baranjska", "Primorsko-goranska"],
  ["Istarska", "Primorsko-goranska"],
  ["Zadarska", "Šibensko-kninska"],
  ["Varaždinska", "Međimurska"],
  ["Dubrovačko-neretvanska", "Splitsko-dalmatinska"],
  ["Grad Zagreb", "Zagrebačka"],
  ["Brodsko-posavska", "Osječko-baranjska"],
  ["Vukovarsko-srijemska", "Osječko-baranjska"],
  ["Karlovačka", "Sisačko-moslavačka"],
  ["Bjelovarsko-bilogorska", "Koprivničko-križevačka"],
  ["Virovitičko-podravska", "Požeško-slavonska"],
  ["Ličko-senjska", "Zadarska"],
  ["Krapinsko-zagorska", "Varaždinska"],
];

export type Derbi = { a: string; b: string; prosjekA: number | null; prosjekB: number | null; igaraA: number; igaraB: number };

export function parDana(dan: number): [string, string] {
  const n = PAROVI.length;
  return PAROVI[(((dan - 1) % n) + n) % n];
}

export function sloziDerbi(dan: number, liga: RedLige[]): Derbi {
  const [a, b] = parDana(dan);
  const ra = liga.find((x) => x.zupanija === a);
  const rb = liga.find((x) => x.zupanija === b);
  return { a, b, prosjekA: ra?.prosjek ?? null, prosjekB: rb?.prosjek ?? null, igaraA: ra?.igara ?? 0, igaraB: rb?.igara ?? 0 };
}

export async function derbi(dan: number): Promise<Derbi> {
  return sloziDerbi(dan, await pohrana().ligaDana(dan));
}

/** Rečenica o ishodu završenog derbija, ili null ako ga nitko nije igrao. */
export function ishodDerbija(d: Derbi): string | null {
  if (d.prosjekA === null && d.prosjekB === null) return null;
  if (d.prosjekA === null || d.prosjekB === null) {
    const tko = d.prosjekA !== null ? d.a : d.b;
    return `${tko} dobiva bez borbe: druga strana se nije pojavila.`;
  }
  if (d.prosjekA === d.prosjekB) return `${d.a} i ${d.b} neriješeno, ${d.prosjekA} : ${d.prosjekB}.`;
  const [pob, por, x, y] = d.prosjekA > d.prosjekB ? [d.a, d.b, d.prosjekA, d.prosjekB] : [d.b, d.a, d.prosjekB, d.prosjekA];
  return `${pob} je dobila ${por}, ${x} : ${y}.`;
}
