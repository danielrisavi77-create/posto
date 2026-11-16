import { podaciZaSliku } from "@/lib/igra";
import { slikaIzazova, slikaOpca, VELICINA } from "@/lib/og";

export const alt = "Izazov na igri Pošto?";
export const size = VELICINA;
export const contentType = "image/png";

export default async function Slika({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const s = await podaciZaSliku(kod);
  return s ? slikaIzazova(s) : slikaOpca();
}
