import { sazetakIzazova } from "@/lib/igra";
import { slika, VELICINA } from "@/lib/og";

export const alt = "Izazov na igri Pošto?";
export const size = VELICINA;
export const contentType = "image/png";

export default async function Slika({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const s = await sazetakIzazova(kod);
  if (!s) {
    return slika({ nadnaslov: "Svaki dan jedan stari račun u kunama", naslov: "Pošto je to danas?", podnozje: "Tvoja županija protiv ostalih" });
  }
  return slika({
    nadnaslov: `${s.ime} (${s.zupanija}) te izaziva`,
    naslov: "Možeš li bolje?",
    razredi: s.razredi,
    broj: `${s.ukupno}/500`,
    podnozje: s.naslov,
  });
}
