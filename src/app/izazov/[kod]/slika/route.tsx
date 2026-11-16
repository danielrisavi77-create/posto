import { podaciZaSliku } from "@/lib/igra";
import { slikaOpca, slikaRacuna } from "@/lib/og";

// Uspravna slika računa za dijeljenje u grupe. Bez današnjih cijena.
export async function GET(_req: Request, ctx: { params: Promise<{ kod: string }> }) {
  const { kod } = await ctx.params;
  const s = await podaciZaSliku(kod);
  const slika = s ? await slikaRacuna(s) : await slikaOpca();
  slika.headers.set("Cache-Control", "public, max-age=3600");
  return slika;
}
