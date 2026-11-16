// SAMO SERVER. Priprema ljestvica za prikaz.
import type { KarticaTablice, RedTabliceUI } from "@/components/Tablice";
import { danBroj, imeSezone, sezona } from "./dan";
import { pohrana, type RedIgraca, type RedLige } from "./pohrana";

function igraci(redovi: RedIgraca[], mojId: string | null, uzIgre: boolean): RedTabliceUI[] {
  return redovi.map((r, i) => ({
    mj: i + 1,
    ime: r.nadimak || "Anonimni kupac",
    dodatak: uzIgre ? `${r.zupanija}, ${r.igara} ${r.igara === 1 ? "račun" : "računa"}` : r.zupanija,
    vrijednost: String(r.bodovi),
    moj: r.igracId === mojId,
  }));
}

export function redoviZupanija(liga: RedLige[], mojaZupanija: string | null, najvise?: number): RedTabliceUI[] {
  const poredak = [...liga].sort((a, b) => b.prosjek - a.prosjek || b.igara - a.igara);
  return poredak
    .map((x, i) => ({ mj: i + 1, ime: x.zupanija, dodatak: `(${x.igara})`, vrijednost: String(x.prosjek), moj: x.zupanija === mojaZupanija }))
    .filter((r) => !najvise || r.mj <= najvise || r.moj);
}

export function mjestoZupanije(liga: RedLige[], zupanija: string): number {
  const poredak = [...liga].sort((a, b) => b.prosjek - a.prosjek || b.igara - a.igara);
  return Math.max(1, poredak.findIndex((x) => x.zupanija === zupanija) + 1);
}

/** Tri ljestvice: županije u sezoni, igrači danas, igrači u sezoni. */
export async function sveLjestvice(mojId: string | null, mojaZupanija: string | null): Promise<KarticaTablice[]> {
  const db = pohrana();
  const [liga, danas, sez] = await Promise.all([db.ligaSezone(sezona()), db.topDana(danBroj(), 20), db.topSezone(sezona(), 20)]);
  return [
    {
      id: "zupanije", naziv: "Županije", stupac: "Županija (broj računa)", vrijednost: "Prosjek",
      redovi: redoviZupanija(liga, mojaZupanija),
      prazno: "U ovoj sezoni još nitko nije platio račun. Budi prvi.",
      opis: `Prosjek bodova po odigranom računu, sezona ${imeSezone()}. Najbolja županija na kraju mjeseca osvaja Zlatnu blagajnu.`,
    },
    {
      id: "danas", naziv: "Igrači danas", stupac: "Kupac", vrijednost: "Bodovi",
      redovi: igraci(danas, mojId, false),
      prazno: "Današnji račun još nitko nije platio.",
      opis: "Dvadeset najboljih na današnjem računu. Kod istog broja bodova prednost ima tko je prije završio.",
    },
    {
      id: "sezona", naziv: "Igrači u sezoni", stupac: "Kupac", vrijednost: "Bodovi",
      redovi: igraci(sez, mojId, true),
      prazno: "U ovoj sezoni još nema odigranih računa.",
      opis: "Zbroj bodova svih računa u sezoni. Tko igra svaki dan, penje se.",
    },
  ];
}
