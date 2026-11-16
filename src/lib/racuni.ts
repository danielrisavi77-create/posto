// SAMO SERVER. Ova datoteka sadrži današnje cijene (polje c) i ne smije se uvoziti
// u klijentske komponente. Klijent dobiva JavnaStavka (bez c) preko javniRacun().
// Sve cijene provjerene su 16. 11. 2026. i svaka ima izvor.

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
  izv: keyof typeof IZVORI;
  /** kratka riječ za rečenicu na računu (samo finale) */
  rijec?: string;
};

export type JavnaStavka = Omit<Stavka, "c" | "izv">;

export type Racun = {
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
    n: "Total Croatia News (cjenik 2017./2018.) i vodič s cjenikom NP-a za 2026.",
    u: "https://total-croatia-news.com/news/higher-ticket-prices-for-all-visitor-categories-for-plitvice-lakes/",
  },
  zid: {
    n: "Dnevnik.hr, ulaznice za zidine (200 kn, potom 40 eura)",
    u: "https://dnevnik.hr/vijesti/hrvatska/novo-poskupljenje-ulaznica-za-dubrovacke-zidine---893078.html",
  },
  hrt: {
    n: "HRT, tumačenje o mjesečnoj pristojbi",
    u: "https://visitlosinj.hr/EasyEdit/UserFiles/kutak-za-iznajmljivace/propisi/2025/tumacenje-hrt-vezano-za-placanje-mjesecne-pristojbe-za-iznajmljivace.pdf",
  },
} satisfies Record<string, Izvor>;

const SLUZBENA_2016 = { p: 0.421, t: "Službena inflacija, 10/2016. do 9/2026. (DZS)" };

export const RACUNI: Racun[] = [
  {
    naslov: "Račun iz zimske jakne",
    god: "listopad 2016.",
    prica: "Našao si ga u džepu jakne koju nisi obukao od 2016. Plaćeno u kunama. Koliko bi iste stvari platio danas?",
    sluzbena: SLUZBENA_2016,
    stavke: [
      { kat: "Dućan", ime: "Svježe mlijeko", opis: "1 litra, katalog trgovačkog lanca", god: "2016.", kn: 4.99, st: 0.66, c: 1.19, max: 3, k: 0.02, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Nutella", opis: "Staklenka od 400 g", god: "2016.", kn: 20, st: 2.65, c: 4.99, max: 10, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Tržnica", ime: "Krumpir", opis: "1 kg, prosjek tržnica (TISUP)", god: "2016.", kn: 4.17, st: 0.55, c: 1.46, max: 3, k: 0.02, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Keks Domaćica", opis: "Pakiranje od 300 g", god: "2016.", kn: 10.99, st: 1.46, c: 3.49, max: 6, k: 0.05, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Prosječna neto plaća", opis: "Mjesečno, Hrvatska (2026.: lipanj, DZS)", god: "2016.", kn: null, st: 749, c: 1555, max: 3000, k: 10, f: 5, cijeli: true, izv: "tg", rijec: "Plaća" },
  },
  {
    naslov: "Ulaznice iz pretinca auta",
    god: "kunski dani",
    prica: "Iz pretinca za rukavice ispale su stare ulaznice i jedna uplatnica. Sve plaćeno u kunama. Pošto je to danas?",
    sluzbena: null,
    stavke: [
      { kat: "Izlet", ime: "Plitvička jezera", opis: "Ulaznica za odrasle, srpanj i kolovoz", god: "2017.", kn: 180, st: 23.89, c: 40, max: 80, k: 1, f: 1, izv: "pl" },
      { kat: "Izlet", ime: "Dubrovačke zidine", opis: "Ulaznica za odrasle u sezoni", god: "2019.", kn: 200, st: 26.54, c: 40, max: 80, k: 1, f: 1, izv: "zid" },
      { kat: "Režije", ime: "HRT pristojba", opis: "Mjesečni iznos za kućanstvo", god: "2010.", kn: 80, st: 10.62, c: 10.62, max: 40, k: 0.1, f: 0.01, izv: "hrt" },
      { kat: "Tržnica", ime: "Mandarine", opis: "1 kg, prosjek tržnica (TISUP)", god: "2016.", kn: 5.98, st: 0.79, c: 3.02, max: 5, k: 0.05, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Kvadrat novog stana", opis: "Prosjek Hrvatske, 1 m² (2026.: prvo polugodište)", god: "2016.", kn: null, st: 1332, c: 3012, max: 6000, k: 50, f: 10, cijeli: true, izv: "tg", rijec: "Kvadrat stana" },
  },
  {
    naslov: "Račun iz bakine ladice",
    god: "listopad 2016.",
    prica: "Baka čuva sve račune. Ovaj je iz 2016. i još se vidi svaka kuna. Reci joj koliko to košta danas, ali nježno.",
    sluzbena: SLUZBENA_2016,
    stavke: [
      { kat: "Dućan", ime: "Kruh, pola kile", opis: "Fini domaći 2016., bakin miješani 2026.", god: "2016.", kn: 6.99, st: 0.93, c: 1.99, max: 4, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Koncentrat rajčice Mutti", opis: "Tuba od 130 g", god: "2016.", kn: 5.99, st: 0.8, c: 1.79, max: 4, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Sredstvo za stakla", opis: "Boca od 750 ml", god: "2016.", kn: 12.9, st: 1.71, c: 2.75, max: 7, k: 0.05, f: 0.01, izv: "tg" },
      { kat: "Dućan", ime: "Trajno mlijeko", opis: "1 litra, ista marka", god: "2016.", kn: 4.99, st: 0.66, c: 0.94, max: 3, k: 0.02, f: 0.01, izv: "tg" },
    ],
    finale: { kat: "Druga strana računa", ime: "Prosječna mirovina", opis: "Mjesečno, Hrvatska", god: "2016.", kn: null, st: 355, c: 725, max: 1500, k: 5, f: 5, cijeli: true, izv: "tg", rijec: "Mirovina" },
  },
];

/** Račun za zadani dan. Dok nema više sadržaja, računi se vrte u krug. */
export function racunZaDan(dan: number): Racun {
  const n = RACUNI.length;
  return RACUNI[(((dan - 1) % n) + n) % n];
}

export function setRacuna(r: Racun): Stavka[] {
  return [...r.stavke, r.finale];
}

function javna(s: Stavka): JavnaStavka {
  // Eksplicitno nabrajanje polja: novo polje u Stavka ne može slučajno procuriti klijentu.
  return { kat: s.kat, ime: s.ime, opis: s.opis, god: s.god, kn: s.kn, st: s.st, max: s.max, k: s.k, f: s.f, cijeli: s.cijeli, rijec: s.rijec };
}

export function javniRacun(r: Racun): JavniRacun {
  return { naslov: r.naslov, god: r.god, prica: r.prica, mjesovit: r.sluzbena === null, set: setRacuna(r).map(javna) };
}
