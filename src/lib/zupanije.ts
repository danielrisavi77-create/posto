export const ZUPANIJE = [
  "Grad Zagreb", "Zagrebačka", "Krapinsko-zagorska", "Sisačko-moslavačka", "Karlovačka",
  "Varaždinska", "Koprivničko-križevačka", "Bjelovarsko-bilogorska", "Primorsko-goranska",
  "Ličko-senjska", "Virovitičko-podravska", "Požeško-slavonska", "Brodsko-posavska", "Zadarska",
  "Osječko-baranjska", "Šibensko-kninska", "Vukovarsko-srijemska", "Splitsko-dalmatinska",
  "Istarska", "Dubrovačko-neretvanska", "Međimurska",
] as const;

export function jeZupanija(z: string): boolean {
  return (ZUPANIJE as readonly string[]).includes(z);
}
