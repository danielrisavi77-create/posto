// SAMO SERVER. Privatne lige: ekipa, obitelj, ured.
import { randomBytes } from "node:crypto";
import { danBroj, sezona } from "./dan";
import { igracId, ocistiNadimak } from "./igra";
import { pohrana, type Liga, type RedIgraca } from "./pohrana";

export const KOD_LIGE = /^[a-z0-9]{6}$/;
const NAJVISE_LIGA = 10;
const NAJVISE_CLANOVA = 100;

function noviKod(): string {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(6), (b) => abc[b % abc.length]).join("");
}

export type RezultatLige = { greska: string } | { liga: Liga };

export async function osnujLigu(nazivSirovi: string): Promise<RezultatLige> {
  const id = await igracId();
  const db = pohrana();
  if (!id || !(await db.igrac(id))) return { greska: "Prvo odigraj današnji račun, pa osnuj ligu." };
  // Isto čišćenje kao za nadimak (znakovi i nepristojne riječi), uz veću duljinu.
  const naziv = nazivSirovi.replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 30);
  if (naziv.length < 2 || !ocistiNadimak(naziv.slice(0, 16))) return { greska: "Upiši naziv lige (barem dva znaka, bez prostota)." };
  if ((await db.ligeIgraca(id)).length >= NAJVISE_LIGA) return { greska: `Možeš biti u najviše ${NAJVISE_LIGA} liga.` };
  return { liga: await db.stvoriLigu({ kod: noviKod(), naziv, vlasnik: id }) };
}

export async function udjiULigu(kod: string): Promise<RezultatLige> {
  const cist = kod.trim().toLowerCase();
  if (!KOD_LIGE.test(cist)) return { greska: "Kod lige ima šest znakova." };
  const id = await igracId();
  const db = pohrana();
  if (!id || !(await db.igrac(id))) return { greska: "Prvo odigraj današnji račun, pa uđi u ligu." };
  const liga = await db.ligaPoKodu(cist);
  if (!liga) return { greska: "Liga s tim kodom ne postoji." };
  const clanovi = await db.clanoviLige(liga.id);
  if (clanovi.some((c) => c.id === id)) return { liga };
  if (clanovi.length >= NAJVISE_CLANOVA) return { greska: "Liga je puna." };
  if ((await db.ligeIgraca(id)).length >= NAJVISE_LIGA) return { greska: `Možeš biti u najviše ${NAJVISE_LIGA} liga.` };
  await db.uclani(liga.id, id);
  return { liga };
}

export type RedTablice = { igracId: string; ime: string; zupanija: string; danas: number | null; sezona: number; igara: number };

/** Tablica lige: svi članovi, i oni koji u sezoni još nisu igrali. Poredak po bodovima sezone. */
export async function tablicaLige(liga: Liga): Promise<RedTablice[]> {
  const db = pohrana();
  const clanovi = await db.clanoviLige(liga.id);
  const ids = clanovi.map((c) => c.id);
  const [sez, dan] = await Promise.all([db.sezonaZaIgrace(sezona(), ids), db.danZaIgrace(danBroj(), ids)]);
  const poSezoni = new Map<string, RedIgraca>(sez.map((r) => [r.igracId, r]));
  const poDanu = new Map<string, RedIgraca>(dan.map((r) => [r.igracId, r]));
  return clanovi
    .map((c) => ({
      igracId: c.id,
      ime: c.nadimak || "Anonimni kupac",
      zupanija: c.zupanija,
      danas: poDanu.get(c.id)?.bodovi ?? null,
      sezona: poSezoni.get(c.id)?.bodovi ?? 0,
      igara: poSezoni.get(c.id)?.igara ?? 0,
    }))
    .sort((a, b) => b.sezona - a.sezona || (b.danas ?? -1) - (a.danas ?? -1) || a.ime.localeCompare(b.ime, "hr"));
}
