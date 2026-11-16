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
