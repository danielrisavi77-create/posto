import { slika, VELICINA } from "@/lib/og";

export const alt = "Pošto? Stari račun u kunama. Pošto je to danas?";
export const size = VELICINA;
export const contentType = "image/png";

export default function Slika() {
  return slika({
    nadnaslov: "Svaki dan jedan stari račun u kunama",
    naslov: "Pošto je to danas?",
    podnozje: "Tvoja županija protiv ostalih",
  });
}
