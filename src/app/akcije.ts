"use server";

import { revalidatePath } from "next/cache";
import { pogodiRundu, zapocni, type RezultatPogotka } from "@/lib/igra";

export type StanjeForme = { greska: string | null };

export async function kreni(_prije: StanjeForme, fd: FormData): Promise<StanjeForme> {
  const zupanija = String(fd.get("zupanija") ?? "");
  const nadimak = String(fd.get("nadimak") ?? "");
  const r = await zapocni(zupanija, nadimak);
  if ("greska" in r) return { greska: r.greska };
  revalidatePath("/");
  return { greska: null };
}

export async function pogodi(indeks: number, vrijednost: number): Promise<RezultatPogotka> {
  // Argumenti server akcije dolaze s klijenta: provjera tipa prije svega ostalog.
  if (typeof indeks !== "number" || typeof vrijednost !== "number") return { greska: "Neispravan zahtjev." };
  return pogodiRundu(indeks, vrijednost);
}
