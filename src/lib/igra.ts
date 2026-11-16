// SAMO SERVER. Pravila igre: start, pogodak, otkrivanje, protivnik.
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "node:crypto";
import { bodovi, razred, rng, runda, zaokruzi, type Razred } from "./bodovanje";
import { danBroj, sezona } from "./dan";
import { pohrana, type Bot, type Igra } from "./pohrana";
import { IZVORI, racunZaDan, setRacuna, type Izvor, type Stavka } from "./racuni";
import { jeZupanija } from "./zupanije";

export const KOLACIC_IGRAC = "posto_id";
export const KOLACIC_IZAZOV = "posto_izazov";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const KOD = /^[a-z0-9]{8}$/;

export type Otkrivanje = {
  moj: number;
  prava: number;
  bodovi: number;
  razred: Razred;
  njegov: number;
  ishod: -1 | 0 | 1;
  izvor: Izvor;
};

export type Protivnik = { ime: string; zupanija: string; bot: boolean; pogodci: number[] };

export async function igracId(): Promise<string | null> {
  const v = (await cookies()).get(KOLACIC_IGRAC)?.value;
  return v && UUID.test(v) ? v : null;
}

export function ocistiNadimak(s: string): string {
  return s.replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
}

function noviKod(): string {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(8), (b) => abc[b % abc.length]).join("");
}

/** Računalni protivnik za prve igrače dana, dok još nema stvarnih. Uvijek je označen kao računalo. */
function bot(dan: number, set: Stavka[]): Bot {
  const r = rng(dan * 104729 + Math.floor(Math.random() * 1e6));
  return {
    ime: "Blagajnica Ruža",
    pogodci: set.map((a) => {
      const v = a.c * (1 + (r() - 0.45) * 0.7);
      return a.cijeli ? Math.round(v / a.f) * a.f : zaokruzi(v);
    }),
  };
}

export async function protivnikIgre(igra: Igra): Promise<Protivnik> {
  if (igra.protivnikId) {
    const p = await pohrana().igraPoId(igra.protivnikId);
    if (p && p.gotovo) return { ime: p.nadimak || "Anonimni kupac", zupanija: p.zupanija, bot: false, pogodci: p.pogodci };
  }
  if (igra.protivnikBot) return { ime: igra.protivnikBot.ime, zupanija: "računalo", bot: true, pogodci: igra.protivnikBot.pogodci };
  // Protivnik je obrisan, a bota nema: deterministički zamjenski bot da igra ne pukne.
  const set = setRacuna(racunZaDan(igra.dan));
  const r = rng(igra.dan * 7919 + 1);
  return { ime: "Blagajnica Ruža", zupanija: "računalo", bot: true, pogodci: set.map((a) => (a.cijeli ? Math.round(a.c * (0.8 + r() * 0.4)) : zaokruzi(a.c * (0.8 + r() * 0.4)))) };
}

export function otkrij(a: Stavka, moj: number, njegov: number): Otkrivanje {
  return { moj, prava: a.c, bodovi: bodovi(moj, a.c), razred: razred(moj, a.c), njegov, ishod: runda(moj, njegov, a.c), izvor: IZVORI[a.izv] };
}

export function otkrivenoDoSad(igra: Igra, prot: Protivnik): Otkrivanje[] {
  const set = setRacuna(racunZaDan(igra.dan));
  return igra.pogodci.map((p, i) => otkrij(set[i], p, prot.pogodci[i]));
}

export type RezultatStarta = { greska: string } | { igra: Igra };

export async function zapocni(zupanija: string, nadimakSirovi: string): Promise<RezultatStarta> {
  if (!jeZupanija(zupanija)) return { greska: "Odaberi županiju da znamo za koga navijaš." };
  const nadimak = ocistiNadimak(nadimakSirovi);
  const db = pohrana();
  const kolacici = await cookies();

  let id = await igracId();
  if (!id) {
    id = randomUUID();
    kolacici.set(KOLACIC_IGRAC, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 400 });
  }
  await db.spremiIgraca({ id, nadimak, zupanija });

  const dan = danBroj();
  const postojeca = await db.igraZaDan(id, dan);
  if (postojeca) return { igra: postojeca };

  // Protivnik: 1) onaj tko te izazvao linkom, 2) nasumičan stvarni igrač iz druge županije, 3) računalo.
  let protivnikId: string | null = null;
  const izazov = kolacici.get(KOLACIC_IZAZOV)?.value;
  if (izazov && KOD.test(izazov)) {
    const iz = await db.igraPoKodu(izazov);
    if (iz && iz.gotovo && iz.dan === dan && iz.igracId !== id) protivnikId = iz.id;
    kolacici.delete(KOLACIC_IZAZOV);
  }
  if (!protivnikId) protivnikId = (await db.nasumicniProtivnik(dan, zupanija, id))?.id ?? null;

  const set = setRacuna(racunZaDan(dan));
  const igra = await db.stvoriIgru({
    kod: noviKod(), dan, sezona: sezona(), igracId: id, nadimak, zupanija,
    protivnikId, protivnikBot: protivnikId ? null : bot(dan, set),
  });
  return { igra };
}

export type RezultatPogotka = { greska: string } | { otkrivanje: Otkrivanje; gotovo: boolean };

export async function pogodiRundu(indeks: number, vrijednost: number): Promise<RezultatPogotka> {
  const id = await igracId();
  if (!id) return { greska: "Igra nije pronađena. Osvježi stranicu." };
  const db = pohrana();
  const dan = danBroj();
  const igra = await db.igraZaDan(id, dan);
  if (!igra) return { greska: "Današnji račun još nisi otvorio. Osvježi stranicu." };

  const set = setRacuna(racunZaDan(dan));
  if (!Number.isInteger(indeks) || indeks < 0 || indeks >= set.length) return { greska: "Neispravna runda." };
  const a = set[indeks];
  if (!Number.isFinite(vrijednost) || vrijednost < 0 || vrijednost > a.max) return { greska: "Cijena je izvan raspona." };
  const v = zaokruzi(vrijednost);

  const prot = await protivnikIgre(igra);
  const zadnji = indeks === set.length - 1;
  const nova = await db.dodajPogodak(igra.id, indeks, v, bodovi(v, a.c), zadnji);
  if (!nova) {
    // Runda je već upisana (dvostruki klik ili drugi tab): vrati ono što je spremljeno, bez novog pokušaja.
    const svjeza = await db.igraZaDan(id, dan);
    if (svjeza && svjeza.pogodci.length > indeks) {
      return { otkrivanje: otkrij(a, svjeza.pogodci[indeks], prot.pogodci[indeks]), gotovo: svjeza.gotovo };
    }
    return { greska: "Ova runda nije na redu. Osvježi stranicu." };
  }
  return { otkrivanje: otkrij(a, v, prot.pogodci[indeks]), gotovo: nova.gotovo };
}
