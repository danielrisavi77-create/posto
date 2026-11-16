// Sve vrijeme računa se po Zagrebu, na serveru. Klijentov sat i zona se ne koriste.

const ZONA = "Europe/Zagreb";

function dijelovi(d: Date): Record<string, number> {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(d)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o;
}

function pocetak(): number {
  const s = process.env.POSTO_POCETAK ?? "2026-11-16";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error("POSTO_POCETAK mora biti u obliku YYYY-MM-DD");
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Redni broj današnjeg računa (1 = dan lansiranja). */
export function danBroj(sad = new Date()): number {
  const p = dijelovi(sad);
  const n = Math.round((Date.UTC(p.year, p.month - 1, p.day) - pocetak()) / 864e5) + 1;
  return Math.max(1, n);
}

/** Sezona je kalendarski mjesec, npr. "2026-11". */
export function sezona(sad = new Date()): string {
  const p = dijelovi(sad);
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

export function datumTekst(sad = new Date()): string {
  const p = dijelovi(sad);
  return `${p.day}. ${p.month}. ${p.year}.`;
}

/** Sekunde do zagrebačke ponoći. Na dan pomicanja sata odstupa do sat vremena. */
export function sekundiDoPonoci(sad = new Date()): number {
  const p = dijelovi(sad);
  return Math.max(1, 86400 - (p.hour * 3600 + p.minute * 60 + p.second));
}

export function danaDoKrajaSezone(sad = new Date()): number {
  const p = dijelovi(sad);
  return new Date(Date.UTC(p.year, p.month, 0)).getUTCDate() - p.day;
}

const MJESECI = ["siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac"];

export function imeSezone(sad = new Date()): string {
  return MJESECI[dijelovi(sad).month - 1];
}

/** Prvi dan (redni broj računa) tekuće sezone, za Ladicu računa. */
export function prviDanSezone(sad = new Date()): number {
  const p = dijelovi(sad);
  return danBroj(sad) - (p.day - 1);
}

export function danaUSezoni(sad = new Date()): number {
  const p = dijelovi(sad);
  return new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
}
