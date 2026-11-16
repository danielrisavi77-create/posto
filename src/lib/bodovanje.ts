// Čiste funkcije: koriste ih i server i klijent. Ovdje ne smije biti nijedna današnja cijena.

export type Razred = "g" | "y" | "o" | "r";

export const EMOJI: Record<Razred, string> = { g: "🟩", y: "🟨", o: "🟧", r: "🟥" };
export const PECAT: Record<Razred, string> = { g: "U cent", y: "Blizu", o: "Onako", r: "Promašaj" };

export function pogreska(pogodak: number, prava: number): number {
  return Math.abs(pogodak - prava) / prava;
}

/** 100 bodova za točnu cijenu, linearno do 0 kod pogreške od 50 % ili više. */
export function bodovi(pogodak: number, prava: number): number {
  const e = Math.min(pogreska(pogodak, prava), 0.5);
  return Math.round(100 * (1 - e / 0.5));
}

export function razred(pogodak: number, prava: number): Razred {
  const e = pogreska(pogodak, prava);
  return e <= 0.05 ? "g" : e <= 0.15 ? "y" : e <= 0.3 ? "o" : "r";
}

/** 1 = runda meni, -1 = protivniku, 0 = neriješeno. */
export function runda(moj: number, njegov: number, prava: number): -1 | 0 | 1 {
  const a = pogreska(moj, prava);
  const b = pogreska(njegov, prava);
  return Math.abs(a - b) < 1e-9 ? 0 : a < b ? 1 : -1;
}

export function zaokruzi(n: number): number {
  return Math.round(n * 100) / 100;
}

export function zbroj(a: number[]): number {
  return a.reduce((x, y) => x + y, 0);
}

export type Osjecaj = { ti: number; stvarno: number; staro: number; novo: number; moje: number };

/** Rast košarice po igraču naspram stvarnog rasta iste košarice. */
export function osjecaj(stare: number[], nove: number[], pogodci: number[]): Osjecaj {
  const staro = zbroj(stare);
  const novo = zbroj(nove);
  const moje = zbroj(pogodci.slice(0, stare.length));
  return { ti: moje / staro - 1, stvarno: novo / staro - 1, staro, novo, moje };
}

/**
 * Opća razina cijena u Hrvatskoj (Eurostat HICP, 2015. = 100). Godišnji prosjeci su iz prc_hicp_aind,
 * a "danas" je rujan 2026. iz mjesečne serije (prc_hicp_minr, 2025. = 100: 105,42) preračunat na istu bazu.
 */
const RAZINA_CIJENA: [number, number][] = [
  [2005, 79.83], [2006, 82.46], [2007, 84.65], [2008, 89.56], [2009, 91.56], [2010, 92.55], [2011, 94.59], [2012, 97.76],
  [2013, 100.04], [2014, 100.26], [2015, 100.0], [2016, 99.37], [2017, 100.67], [2018, 102.23], [2019, 103.04], [2020, 103.06],
  [2021, 105.82], [2022, 117.11], [2023, 126.94], [2024, 132.04], [2025, 137.82],
];
const RAZINA_DANAS = 145.29;
const GODINA_DANAS = 2026;

export type Presuda = { godina: number | null; naslov: string; opis: string; /** za poruku i sliku, u prvom licu */ izjava: string };

/**
 * Iz koje su godine igračeve cijene. Omjer odgovora i stvarnih cijena (geometrijska sredina, da jedna stavka ne preteže)
 * prevodi se u godinu po općoj razini cijena. To je igra, ne mjera: tri stavke nisu košarica.
 */
export function presuda(prave: number[], pogodci: number[]): Presuda {
  const omjeri = prave.map((c, i) => Math.max(0.01, pogodci[i]) / c).filter((x) => Number.isFinite(x) && x > 0);
  const q = omjeri.length ? Math.exp(omjeri.reduce((z, x) => z + Math.log(x), 0) / omjeri.length) : 1;
  const posto = Math.round(Math.abs(q - 1) * 100);
  if (q >= 0.97 && q <= 1.04) {
    return { godina: GODINA_DANAS, naslov: `Tvoje cijene su iz ${GODINA_DANAS}.`, opis: "Znaš pošto je što. Tebe na blagajni ništa ne iznenadi.", izjava: `Moje cijene su iz ${GODINA_DANAS}. Znam pošto je što.` };
  }
  if (q > 1.04) {
    // Budućnost je dosjetka, ne prognoza: pretpostavka je 4 % rasta godišnje.
    const g = Math.min(2050, GODINA_DANAS + Math.ceil(Math.log(q) / Math.log(1.04)));
    return { godina: g, naslov: `Tvoje cijene su iz ${g}.`, opis: `Tvoji odgovori su u prosjeku ${posto} % iznad današnjih cijena. Uz 4 % rasta godišnje, toliko će sve koštati ${g}.`, izjava: `Moje cijene su iz ${g}. Već plaćam budućnost.` };
  }
  const razina = RAZINA_DANAS * q;
  if (razina < RAZINA_CIJENA[0][1] - 1.5) {
    return { godina: null, naslov: "Tvoje cijene su iz prošlog stoljeća.", opis: `Tvoji odgovori su u prosjeku ${posto} % ispod današnjih cijena. Tako jeftino nije bilo ni 2005.`, izjava: "Moje cijene su iz prošlog stoljeća." };
  }
  // Najbliža godina; kad ih je više jednako blizu (2013. do 2020. cijene su stajale), uzima se najkasnija.
  let g = RAZINA_CIJENA[0][0];
  let najblize = Infinity;
  for (const [godina, indeks] of RAZINA_CIJENA) {
    const d = Math.abs(indeks - razina);
    if (d <= najblize + 0.75) {
      g = godina;
      najblize = Math.min(najblize, d);
    }
  }
  return { godina: g, naslov: `Tvoje cijene su iz ${g}.`, opis: `Tvoji odgovori su u prosjeku ${posto} % ispod današnjih cijena. Na toj razini cijene su bile ${g}.`, izjava: `Moje cijene su iz ${g}.` };
}

export function tipKupca(o: Osjecaj): { ime: string; opis: string } {
  const d = o.ti - o.stvarno;
  if (d > 0.2) return { ime: "Crnogledi kupac", opis: "Misliš da je skuplje nego što jest." };
  if (d < -0.2) return { ime: "Još živi u kunama", opis: "Misliš da je jeftinije nego što jest." };
  return { ime: "Hodajući cjenik", opis: "Tvoj osjećaj za cijene je točan." };
}

const DOSJETKE: Record<"g" | "y" | "o" | "lo" | "hi", string[]> = {
  g: ["U cent. Radiš na blagajni?", "Ovo se ne pogađa, ovo se zna.", "Tebi račun ne treba, ti si račun."],
  y: ["Blizu. Vidi se da sam ideš u dućan.", "Solidno. Falilo je malo sitniša.", "Skoro. Blagajnica bi ti progledala kroz prste."],
  o: ["Onako. Kao kad procjenjuješ račun prije blagajne.", "Ni vrit ni mimo.", "Može proći, ali ne kod bake."],
  lo: ["Probudi se, kuna više nema.", "Te cijene pamti još samo tvoja stara jakna.", "Lijepo bi bilo. Nije."],
  hi: ["Polako, nije sve Dubrovnik.", "Tebe su već previše puta oderali.", "Čak ni na moru u kolovozu."],
};

export function dosjetka(r: Razred, pogodak: number, prava: number, i: number): string {
  const k = r === "r" ? (pogodak < prava ? "lo" : "hi") : r;
  const lista = DOSJETKE[k];
  return lista[((i % lista.length) + lista.length) % lista.length];
}

export function eur(n: number, cijeli = false): string {
  if (cijeli) return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
  return n.toFixed(2).replace(".", ",") + " €";
}

export function kune(n: number): string {
  return n.toFixed(2).replace(".", ",") + " kn";
}

export function post(x: number): string {
  const p = Math.round(x * 100);
  return (p > 0 ? "+" : "") + p + " %";
}

/** Deterministički generator za računalnog protivnika. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
