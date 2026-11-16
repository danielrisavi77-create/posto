// SAMO SERVER. Pravila igre: start, pogodak, otkrivanje, protivnik.
import { cookies, headers } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { bodovi, eur, osjecaj, pogreska, razred, rng, runda, tipKupca, zaokruzi, type Razred } from "./bodovanje";
import { danBroj, sezona } from "./dan";
import { pohrana, type Bot, type Igra } from "./pohrana";
import { IZVORI, racunIgre, racunZaDan, setRacuna, type Izvor, type Stavka } from "./racuni";
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
  /** je li na ovoj stavci odigrana dupla */
  dupla: boolean;
  /** usporedba s ostalim kupcima dana; null dok ih nema dovoljno */
  kupci: Kupci | null;
};

export type Kupci = {
  /** broj drugih kupaca koji su odgovorili na ovu stavku */
  n: number;
  /** postotak kupaca od kojih je ovaj odgovor bliži cijeni */
  boljiOd: number;
  /** srednji odgovor svih kupaca */
  medijan: number;
  /** postotak kupaca koji su rekli manje od stvarne cijene */
  prenisko: number;
};

export type Protivnik = { ime: string; zupanija: string; bot: boolean; pogodci: number[] };

export async function igracId(): Promise<string | null> {
  const v = (await cookies()).get(KOLACIC_IGRAC)?.value;
  return v && UUID.test(v) ? v : null;
}

// Kratki popis korijena koje ne želimo na javnoj ljestvici. Nije potpun: služi kao prva crta, ne kao moderacija.
const ZABRANJENO = ["jeb", "kurac", "kurc", "pick", "pizd", "sranj", "govn", "drolj", "kurv", "peder", "ustas", "cetnik", "hitler", "nazi", "fuck", "shit", "nigg"];

function jeNepristojno(s: string): boolean {
  const n = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/[^a-z]/g, "");
  return ZABRANJENO.some((z) => n.includes(z));
}

/** Dopušta slova, brojke, razmak i . _ - ; nepristojan nadimak postaje prazan (prikazuje se kao Anonimni kupac). */
export function ocistiNadimak(s: string): string {
  const cist = s.replace(/[^\p{L}\p{N} ._-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
  return jeNepristojno(cist) ? "" : cist;
}

/** Ključ mreže za ograničenje zahtjeva: sažetak IP adrese sa solju, izvorna adresa se ne sprema. */
async function kljucMreze(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "nepoznato";
  // || umjesto ??: prazna varijabla (POSTO_SOL= u .env) mora se ponašati kao da je nema.
  const sol = process.env.POSTO_SOL || process.env.SUPABASE_SERVICE_ROLE_KEY || "razvoj";
  return createHash("sha256").update(`${sol}:${ip}`).digest("hex").slice(0, 32);
}

const PREVISE = "Previše pokušaja s ove mreže. Pokušaj malo kasnije.";

/** Ako sama provjera padne, igra se ne blokira: greška ide u log. */
async function unutarGranice(vrsta: string, limit: number, sekundi: number): Promise<boolean> {
  try {
    return await pohrana().dopusti(`${vrsta}:${await kljucMreze()}`, limit, sekundi);
  } catch (e) {
    console.error("[posto] ograničenje zahtjeva nije dostupno:", e);
    return true;
  }
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
    if (p && p.gotovo && p.racun === igra.racun) return { ime: p.nadimak || "Anonimni kupac", zupanija: p.zupanija, bot: false, pogodci: p.pogodci };
  }
  if (igra.protivnikBot) return { ime: igra.protivnikBot.ime, zupanija: "računalo", bot: true, pogodci: igra.protivnikBot.pogodci };
  // Protivnik je obrisan, a bota nema: deterministički zamjenski bot da igra ne pukne.
  const set = setRacuna(racunIgre(igra));
  const r = rng(igra.dan * 7919 + 1);
  return { ime: "Blagajnica Ruža", zupanija: "računalo", bot: true, pogodci: set.map((a) => (a.cijeli ? Math.round(a.c * (0.8 + r() * 0.4)) : zaokruzi(a.c * (0.8 + r() * 0.4)))) };
}

/** Dupla: dvostruki bodovi ako je odgovor unutar 15 % cijene, inače nula. */
export function bodoviRunde(moj: number, prava: number, dupla: boolean): number {
  if (!dupla) return bodovi(moj, prava);
  const r = razred(moj, prava);
  return r === "g" || r === "y" ? bodovi(moj, prava) * 2 : 0;
}

export function otkrij(a: Stavka, moj: number, njegov: number, dupla: boolean, kupci: Kupci | null): Otkrivanje {
  return {
    moj, prava: a.c, bodovi: bodoviRunde(moj, a.c, dupla), razred: razred(moj, a.c), njegov,
    ishod: runda(moj, njegov, a.c), izvor: IZVORI[a.izv], dupla, kupci,
  };
}

export function otkrivenoDoSad(igra: Igra, prot: Protivnik): Otkrivanje[] {
  const set = setRacuna(racunIgre(igra));
  return igra.pogodci.map((p, i) => otkrij(set[i], p, prot.pogodci[i], igra.dupla === i, null));
}

/* ---------- Usporedba sa svim kupcima dana ---------- */

const NAJMANJE_KUPACA = 2;
const predmemorija = new Map<string, { do: number; redovi: { igracId: string; pogodci: number[] }[] }>();

async function odgovoriDana(dan: number, racun: string) {
  const kljuc = `${dan}:${racun}`;
  const p = predmemorija.get(kljuc);
  if (p && p.do > Date.now()) return p.redovi;
  const redovi = await pohrana().pogodciDana(dan, racun);
  predmemorija.set(kljuc, { do: Date.now() + 15_000, redovi });
  if (predmemorija.size > 20) predmemorija.delete(predmemorija.keys().next().value as string);
  return redovi;
}

/** Kako stoji jedan odgovor među odgovorima drugih kupaca na istu stavku. null dok nema dovoljno kupaca. */
export async function usporedba(dan: number, racun: string, indeks: number, moj: number, prava: number, mojId: string): Promise<Kupci | null> {
  try {
    const drugi = (await odgovoriDana(dan, racun)).filter((r) => r.igracId !== mojId && r.pogodci.length > indeks).map((r) => r.pogodci[indeks]);
    if (drugi.length < NAJMANJE_KUPACA) return null;
    const mojaPogreska = pogreska(moj, prava);
    const slabiji = drugi.filter((v) => pogreska(v, prava) > mojaPogreska).length;
    const poredani = [...drugi].sort((x, y) => x - y);
    const medijan = poredani.length % 2 ? poredani[(poredani.length - 1) / 2] : (poredani[poredani.length / 2 - 1] + poredani[poredani.length / 2]) / 2;
    return { n: drugi.length, boljiOd: Math.round((slabiji / drugi.length) * 100), medijan: zaokruzi(medijan), prenisko: Math.round((drugi.filter((v) => v < prava).length / drugi.length) * 100) };
  } catch (e) {
    console.error("[posto] usporedba nije dostupna:", e);
    return null;
  }
}

/* ---------- Start i runde ---------- */

export type RezultatStarta = { greska: string } | { igra: Igra };

/** Otvara današnji račun. Županija smije izostati: bira se nakon prve stavke. */
export async function zapocni(opcije: { zupanija?: string; nadimak?: string; izazov?: string }): Promise<RezultatStarta> {
  const db = pohrana();
  const kolacici = await cookies();

  const dan = danBroj();
  let id = await igracId();
  const postojeci = id ? await db.igrac(id) : null;
  if (id) {
    const postojeca = await db.igraZaDan(id, dan);
    if (postojeca) return { igra: postojeca };
  }

  // Najviše 30 novih računa na sat po mreži: štiti ligu od ponavljanja igre brisanjem kolačića.
  // Provjera ide prije ikakvog upisa, pa odbijeni zahtjev ne ostavlja ni red u tablici igrača.
  if (!(await unutarGranice("start", 30, 3600))) return { greska: PREVISE };

  if (!id) {
    id = randomUUID();
    kolacici.set(KOLACIC_IGRAC, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 400 });
  }
  const zupanija = opcije.zupanija && jeZupanija(opcije.zupanija) ? opcije.zupanija : (postojeci?.zupanija ?? "");
  const nadimak = opcije.nadimak !== undefined ? ocistiNadimak(opcije.nadimak) : (postojeci?.nadimak ?? "");
  await db.spremiIgraca({ id, nadimak, zupanija });
  const racun = racunZaDan(dan);

  // Protivnik: 1) onaj tko te izazvao linkom, 2) nasumičan stvarni igrač iz druge županije, 3) računalo.
  let protivnikId: string | null = null;
  const izazov = opcije.izazov ?? kolacici.get(KOLACIC_IZAZOV)?.value;
  if (izazov && KOD.test(izazov)) {
    const iz = await db.igraPoKodu(izazov);
    if (iz && iz.gotovo && iz.dan === dan && iz.racun === racun.id && iz.igracId !== id) protivnikId = iz.id;
    if (kolacici.has(KOLACIC_IZAZOV)) kolacici.delete(KOLACIC_IZAZOV);
  }
  if (!protivnikId) {
    // Bez županije protivnik može biti bilo tko; "-" nije ničija županija.
    const p = await db.nasumicniProtivnik(dan, zupanija || "-", id);
    if (p && p.racun === racun.id) protivnikId = p.id;
  }

  const set = setRacuna(racun);
  const igra = await db.stvoriIgru({
    kod: noviKod(), dan, racun: racun.id, sezona: sezona(), igracId: id, nadimak, zupanija,
    protivnikId, protivnikBot: protivnikId ? null : bot(dan, set),
  });
  return { igra };
}

export type JavniProtivnik = { ime: string; zupanija: string; bot: boolean };
export type RezultatPogotka = { greska: string } | { otkrivanje: Otkrivanje; gotovo: boolean; protivnik: JavniProtivnik };

export async function pogodiRundu(indeks: number, vrijednost: number, dupla: boolean): Promise<RezultatPogotka> {
  const id = await igracId();
  if (!id) return { greska: "Igra nije pronađena. Osvježi stranicu." };
  if (!(await unutarGranice("pogodak", 120, 60))) return { greska: PREVISE };
  const db = pohrana();
  const dan = danBroj();
  const igra = await db.igraZaDan(id, dan);
  if (!igra) return { greska: "Današnji račun još nisi otvorio. Osvježi stranicu." };

  const set = setRacuna(racunIgre(igra));
  if (!Number.isInteger(indeks) || indeks < 0 || indeks >= set.length) return { greska: "Neispravna runda." };
  // Bez županije se može odigrati samo prva stavka: bodovi moraju nekome pripasti.
  const a = set[indeks];
  if (!Number.isFinite(vrijednost) || vrijednost < 0 || vrijednost > a.max) return { greska: "Cijena je izvan raspona." };
  if (dupla && igra.dupla !== null) return { greska: "Duplu si na ovom računu već iskoristio." };
  const v = zaokruzi(vrijednost);

  const prot = await protivnikIgre(igra);
  const javni = { ime: prot.ime, zupanija: prot.zupanija, bot: prot.bot };
  const zadnji = indeks === set.length - 1;
  const nova = await db.dodajPogodak(igra.id, indeks, v, bodoviRunde(v, a.c, dupla), zadnji, dupla);
  if (!nova) {
    // Runda je već upisana (dvostruki klik ili drugi tab): vrati ono što je spremljeno, bez novog pokušaja.
    const svjeza = await db.igraZaDan(id, dan);
    if (svjeza && svjeza.pogodci.length > indeks) {
      const kupci = await usporedba(dan, svjeza.racun, indeks, svjeza.pogodci[indeks], a.c, id);
      return { otkrivanje: otkrij(a, svjeza.pogodci[indeks], prot.pogodci[indeks], svjeza.dupla === indeks, kupci), gotovo: svjeza.gotovo, protivnik: javni };
    }
    return { greska: "Ova runda nije na redu. Osvježi stranicu." };
  }
  const kupci = await usporedba(dan, nova.racun, indeks, v, a.c, id);
  return { otkrivanje: otkrij(a, v, prot.pogodci[indeks], dupla, kupci), gotovo: nova.gotovo, protivnik: javni };
}

/** Prvi odgovor otvara račun: nema obrasca prije igre. */
export async function prviPogodak(vrijednost: number, dupla: boolean, izazov?: string): Promise<RezultatPogotka> {
  const start = await zapocni({ izazov });
  if ("greska" in start) return { greska: start.greska };
  if (start.igra.pogodci.length > 0) return { greska: "Ovaj račun si već započeo. Osvježi stranicu." };
  return pogodiRundu(0, vrijednost, dupla);
}

/**
 * Neobavezan upis: nadimak za ljestvicu i županija za ligu županija. Jednom upisana županija se ne mijenja,
 * da se bodovi završenih računa ne mogu seliti iz županije u županiju.
 */
export async function postaviKupca(zupanijaSirova: string, nadimakSirovi: string): Promise<{ greska: string } | { ok: true }> {
  if (zupanijaSirova && !jeZupanija(zupanijaSirova)) return { greska: "Ta županija ne postoji." };
  const id = await igracId();
  if (!id) return { greska: "Igra nije pronađena. Osvježi stranicu." };
  if (!(await unutarGranice("kupac", 30, 3600))) return { greska: "Previše izmjena. Pokušaj kasnije." };
  const db = pohrana();
  const postojeci = await db.igrac(id);
  const zupanija = postojeci?.zupanija || zupanijaSirova;
  const nadimak = ocistiNadimak(nadimakSirovi);
  await db.spremiIgraca({ id, nadimak, zupanija });
  const igra = await db.igraZaDan(id, danBroj());
  if (igra) await db.azurirajKupcaIgre(igra.id, igra.zupanija || zupanija, nadimak);
  return { ok: true };
}

/** Javni sažetak završene igre za stranicu izazova i sliku pregleda. Ne sadrži cijene ni pogotke. */
export type Sazetak = { ime: string; zupanija: string; ukupno: number; razredi: Razred[]; dan: number; naslov: string; danasnji: boolean; racun: string; /** jedan odgovor izazivača, bez točne cijene: mamac za dvoboj */ mamac: string };

export async function sazetakIzazova(kod: string): Promise<Sazetak | null> {
  if (!KOD.test(kod)) return null;
  const g = await pohrana().igraPoKodu(kod);
  if (!g || !g.gotovo) return null;
  const racun = racunIgre(g);
  const set = setRacuna(racun);
  return {
    ime: g.nadimak || "Anonimni kupac", zupanija: g.zupanija, ukupno: g.ukupno,
    razredi: set.map((a, i) => razred(g.pogodci[i], a.c)), dan: g.dan, naslov: racun.naslov, danasnji: g.dan === danBroj(), racun: racun.id,
    mamac: mamacIgre(g),
  };
}

export async function zapamtiIzazov(kod: string): Promise<void> {
  if (!KOD.test(kod)) return;
  (await cookies()).set(KOLACIC_IZAZOV, kod, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 });
}

/** Odgovor na stavci gdje je igrač bio najdalje od cijene. Točna cijena se ne otkriva. */
export function mamacIgre(g: Igra): string {
  const racun = racunIgre(g);
  let najgora = 0;
  racun.stavke.forEach((a, i) => {
    if (pogreska(g.pogodci[i], a.c) > pogreska(g.pogodci[najgora], racun.stavke[najgora].c)) najgora = i;
  });
  const a = racun.stavke[najgora];
  return `${a.ime}: ${eur(g.pogodci[najgora], a.cijeli)}`;
}

/** Podaci za slike računa (pregled linka i slika za dijeljenje). Bez današnjih cijena. */
export async function podaciZaSliku(kod: string) {
  if (!KOD.test(kod)) return null;
  const g = await pohrana().igraPoKodu(kod);
  if (!g || !g.gotovo) return null;
  const racun = racunIgre(g);
  const set = setRacuna(racun);
  const o = osjecaj(racun.stavke.map((x) => x.st), racun.stavke.map((x) => x.c), g.pogodci);
  return {
    ime: g.nadimak || "Anonimni kupac", zupanija: g.zupanija, naslov: racun.naslov, dan: g.dan, ukupno: g.ukupno,
    razredi: set.map((a, i) => razred(g.pogodci[i], a.c)), mamac: mamacIgre(g),
    stavke: set.map((a, i) => ({ ime: a.ime, razred: razred(g.pogodci[i], a.c), bodovi: g.bodovi[i] })),
    tip: tipKupca(o).ime,
  };
}
