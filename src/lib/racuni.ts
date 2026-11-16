// SAMO SERVER. Ova datoteka sadrži današnje cijene (polje c) i ne smije se uvoziti
// u klijentske komponente. Klijent dobiva JavnaStavka (bez c) preko javniRacun().
// Sve cijene provjerene su 16. 11. 2026. i svaka ima izvor.
// Ručno uneseni računi su u ovoj datoteci; računi iz DZS-ovih podataka generiraju se u racuni-dzs.ts.
import { RACUNI_DZS } from "./racuni-dzs";

export type Izvor = { n: string; u: string };

export type Stavka = {
  kat: string;
  ime: string;
  opis: string;
  god: string;
  /** cijena nekad u kunama, ako ju izvor navodi */
  kn: number | null;
  /** cijena nekad u eurima */
  st: number;
  /** cijena danas: nikad ne ide klijentu prije pogotka */
  c: number;
  /** gornja granica klizača, korak klizača, fini korak */
  max: number;
  k: number;
  f: number;
  cijeli?: boolean;
  /** današnja cijena je procjena (službena cijena iz 12/2023. uvećana za rast cijena skupine), a ne izmjerena cijena */
  procjena?: boolean;
  izv: keyof typeof IZVORI;
  /** kratka riječ za rečenicu na računu (samo finale) */
  rijec?: string;
};

export type JavnaStavka = Omit<Stavka, "c" | "izv">;

export type Racun = {
  /** Stabilna oznaka: sprema se uz igru i nikad se ne mijenja ni ne koristi ponovno. */
  id: string;
  naslov: string;
  god: string;
  prica: string;
  sluzbena: { p: number; t: string } | null;
  stavke: Stavka[];
  finale: Stavka;
};

export type JavniRacun = Omit<Racun, "stavke" | "finale" | "sluzbena"> & {
  mjesovit: boolean;
  set: JavnaStavka[];
};

export const IZVORI = {
  tg: {
    n: "Telegram.hr, usporedba kataloga i tržnica 2016. i 2026. (21. 10. 2026.)",
    u: "https://www.telegram.hr/politika-kriminal/istina-o-10-godina-plenkovica-na-vlasti-place-rasle-108-posto-stanovi-poskupili-dva-i-pol-puta-krumpir-160-posto/",
  },
  pl: {
    n: "NP Plitvička jezera, službeni cjenik 2026.; cijena 2017. prema Total Croatia News",
    u: "https://np-plitvicka-jezera.hr/planirajte-posjet/cjenik/",
  },
  nn: {
    n: "Narodne novine: uredbe o visini minimalne plaće za 2016. (NN 140/15) i 2026. (NN 132/25)",
    u: "https://narodne-novine.nn.hr/clanci/sluzbeni/2025_10_132_1931.html",
  },
  zid: {
    n: "Dnevnik.hr, ulaznice za zidine (200 kn, potom 40 eura)",
    u: "https://dnevnik.hr/vijesti/hrvatska/novo-poskupljenje-ulaznica-za-dubrovacke-zidine---893078.html",
  },
  dzs: {
    n: "DZS, prosječne maloprodajne cijene u kunama i eurima (12/2022. i 12/2023.); rast do 9/2026. prema Eurostatovu HICP-u za Hrvatsku",
    u: "https://podaci.dzs.hr/hr/podaci/cijene/uvodenje-eura-prosjecne-maloprodajne-cijene/",
  },
  dzsplace: {
    n: "DZS, prosječne neto i bruto plaće po županijama (2022. i I. do III. 2026.)",
    u: "https://podaci.dzs.hr/media/xpkfrkth/zaposlenost-i-place-pregled-po-zupanijama.xlsx",
  },
  hrt: {
    n: "HRT, tumačenje o mjesečnoj pristojbi",
    u: "https://visitlosinj.hr/EasyEdit/UserFiles/kutak-za-iznajmljivace/propisi/2025/tumacenje-hrt-vezano-za-placanje-mjesecne-pristojbe-za-iznajmljivace.pdf",
  },
} satisfies Record<string, Izvor>;

const SLUZBENA_2016 = { p: 0.421, t: "Službena inflacija, 10/2016. do 9/2026. (DZS)" };

const RUCNI: Racun[] = [
  {
    id: "jakna-2016",
    naslov: "Račun iz zimske jakne",
    god: "listopad 2016.",
    prica: "Našao si ga u džepu jakne koju nisi obukao od 2016. Plaćeno u kunama. Koliko bi iste stvari platio danas?",
    sluzbena: SLUZBENA_2016,
    stavke: [
      { kat: "Dućan", ime: "Svježe mlijeko", opis: "1 litra, katalog trgovačkog lanca", god: "2016.", kn: 4.99, st: 0.66, c: 1.19, max: 3, k: 0.02, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Lješnjak-namaz", opis: "Staklenka od 400 g, ista poznata marka 2016. i 2026.", god: "2016.", kn: 20, st: 2.65, c: 4.99, max: 10, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Tržnica", ime: "Krumpir", opis: "1 kg, prosjek tržnica (TISUP)", god: "2016.", kn: 4.17, st: 0.55, c: 1.46, max: 3, k: 0.02, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Čajni keks s čokoladom", opis: "Pakiranje od 300 g, ista poznata marka 2016. i 2026.", god: "2016.", kn: 10.99, st: 1.46, c: 3.49, max: 6, k: 0.05, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Prosječna neto plaća", opis: "Mjesečno, Hrvatska (2026.: lipanj, DZS)", god: "2016.", kn: null, st: 749, c: 1555, max: 3000, k: 10, f: 5, cijeli: true, izv: "tg", rijec: "Plaća" },
  },
  {
    id: "pretinac-auta",
    naslov: "Ulaznice iz pretinca auta",
    god: "kunski dani",
    prica: "Iz pretinca za rukavice ispale su stare ulaznice i jedna uplatnica. Sve plaćeno u kunama. Pošto je to danas?",
    sluzbena: null,
    stavke: [
      { kat: "Izlet", ime: "Plitvička jezera", opis: "Jednodnevna ulaznica za odrasle, kolovoz, do 16 sati", god: "2017.", kn: 180, st: 23.89, c: 40, max: 80, k: 1, f: 1, izv: "pl" },
      { kat: "Izlet", ime: "Dubrovačke zidine", opis: "Ulaznica za odrasle u sezoni", god: "2019.", kn: 200, st: 26.54, c: 40, max: 80, k: 1, f: 1, izv: "zid" },
      { kat: "Režije", ime: "HRT pristojba", opis: "Mjesečni iznos za kućanstvo", god: "2010.", kn: 80, st: 10.62, c: 10.62, max: 40, k: 0.1, f: 0.01, izv: "hrt" },
      { kat: "Tržnica", ime: "Mandarine", opis: "1 kg, prosjek tržnica (TISUP)", god: "2016.", kn: 5.98, st: 0.79, c: 3.02, max: 5, k: 0.05, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Kvadrat novog stana", opis: "Prosjek Hrvatske, 1 m² (2026.: prvo polugodište)", god: "2016.", kn: null, st: 1332, c: 3012, max: 6000, k: 50, f: 10, cijeli: true, izv: "tg", rijec: "Kvadrat stana" },
  },
  {
    id: "bakina-ladica",
    naslov: "Račun iz bakine ladice",
    god: "listopad 2016.",
    prica: "Baka čuva sve račune. Ovaj je iz 2016. i još se vidi svaka kuna. Reci joj koliko to košta danas, ali nježno.",
    sluzbena: SLUZBENA_2016,
    stavke: [
      { kat: "Dućan", ime: "Kruh, pola kile", opis: "Fini domaći 2016., bakin miješani 2026.", god: "2016.", kn: 6.99, st: 0.93, c: 1.99, max: 4, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Koncentrat rajčice", opis: "Tuba od 130 g, ista marka 2016. i 2026.", god: "2016.", kn: 5.99, st: 0.8, c: 1.79, max: 4, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Sredstvo za stakla", opis: "Boca od 750 ml", god: "2016.", kn: 12.9, st: 1.71, c: 2.75, max: 7, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Trajno mlijeko", opis: "1 litra, ista marka", god: "2016.", kn: 4.99, st: 0.66, c: 0.94, max: 3, k: 0.02, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Prosječna mirovina", opis: "Mjesečno, Hrvatska", god: "2016.", kn: null, st: 355, c: 725, max: 1500, k: 5, f: 5, cijeli: true, izv: "tg", rijec: "Mirovina" },
  },
  {
    // Izvor za ove četiri stavke navodi cijene iz 2016. samo u eurima; kune su preračunate po fiksnom tečaju 7,5345.
    id: "ceker-plac",
    naslov: "Ceker s placa",
    god: "listopad 2016.",
    prica: "Na dnu starog cekera ostao je papirić na kojem je kumica zbrojila račun. Olovkom, u kunama. Koliko bi ti danas zbrojila?",
    sluzbena: SLUZBENA_2016,
    stavke: [
      { kat: "Tržnica", ime: "Crveni luk", opis: "1 kg, prosjek tržnica (TISUP), kune preračunate", god: "2016.", kn: 6.55, st: 0.87, c: 2.05, max: 5, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Tržnica", ime: "Zeleni kupus", opis: "1 kg, prosjek tržnica (TISUP), kune preračunate", god: "2016.", kn: 5.2, st: 0.69, c: 1.93, max: 5, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Tržnica", ime: "Češnjak", opis: "1 kg, prosjek tržnica (TISUP), kune preračunate", god: "2016.", kn: 42.87, st: 5.69, c: 8.15, max: 20, k: 0.1, f: 0.01, izv: "tg" },
      { kat: "Tržnica", ime: "Špinat", opis: "1 kg, prosjek tržnica (TISUP), kune preračunate", god: "2016.", kn: 16.27, st: 2.16, c: 4.59, max: 10, k: 0.05, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Minimalna plaća", opis: "Bruto, mjesečno, propisana uredbom Vlade", god: "2016.", kn: 3120, st: 414.09, c: 1050, max: 2000, k: 10, f: 5, cijeli: true, izv: "nn", rijec: "Minimalna plaća" },
  },
];

// Raspored: ručni računi (2016. i stariji) raspoređeni su među DZS-ove (prosinac 2022.), da tjedan ne bude jednoličan.
// Novi računi dodaju se NA KRAJ popisa; postojeći redoslijed se ne dira.
export const RACUNI: Racun[] = [
  RUCNI[0], ...RACUNI_DZS.slice(0, 6),
  RUCNI[1], ...RACUNI_DZS.slice(6, 13),
  RUCNI[2], ...RACUNI_DZS.slice(13, 20),
  RUCNI[3], ...RACUNI_DZS.slice(20),
];

/** Račun koji NOVA igra dobiva na zadani dan. Dok nema više sadržaja, računi se vrte u krug.
 *  Za već započetu igru uvijek koristi racunIgre(): raspored se mijenja kad se doda sadržaj. */
export function racunZaDan(dan: number): Racun {
  const n = RACUNI.length;
  return RACUNI[(((dan - 1) % n) + n) % n];
}

/** Račun po kojem je igra stvarno odigrana (spremljena oznaka), neovisno o današnjem rasporedu. */
export function racunIgre(igra: { dan: number; racun: string }): Racun {
  return RACUNI.find((r) => r.id === igra.racun) ?? racunZaDan(igra.dan);
}

export function setRacuna(r: Racun): Stavka[] {
  return [...r.stavke, r.finale];
}

function javna(s: Stavka): JavnaStavka {
  // Eksplicitno nabrajanje polja: novo polje u Stavka ne može slučajno procuriti klijentu.
  return { kat: s.kat, ime: s.ime, opis: s.opis, god: s.god, kn: s.kn, st: s.st, max: s.max, k: s.k, f: s.f, cijeli: s.cijeli, procjena: s.procjena, rijec: s.rijec };
}

export function javniRacun(r: Racun): JavniRacun {
  return { id: r.id, naslov: r.naslov, god: r.god, prica: r.prica, mjesovit: r.sluzbena === null, set: setRacuna(r).map(javna) };
}
