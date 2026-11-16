"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pogodiRundu, postaviKupca, prviPogodak, type RezultatPogotka } from "@/lib/igra";
import { osnujLigu, udjiULigu } from "@/lib/liga";

export type StanjeForme = { greska: string | null };

export async function pogodi(indeks: number, vrijednost: number, dupla: boolean, izazov?: string): Promise<RezultatPogotka> {
  // Argumenti server akcije dolaze s klijenta: provjera tipa prije svega ostalog.
  if (typeof indeks !== "number" || typeof vrijednost !== "number" || typeof dupla !== "boolean") return { greska: "Neispravan zahtjev." };
  if (izazov !== undefined && typeof izazov !== "string") return { greska: "Neispravan zahtjev." };
  // Prva stavka otvara račun ako još nije otvoren; kod izazova određuje protivnika.
  if (indeks === 0) {
    const r = await prviPogodak(vrijednost, dupla, izazov);
    if ("greska" in r && r.greska.startsWith("Ovaj račun si već započeo")) return pogodiRundu(0, vrijednost, dupla);
    return r;
  }
  return pogodiRundu(indeks, vrijednost, dupla);
}

export async function upisiKupca(zupanija: string, nadimak: string): Promise<{ greska: string } | { ok: true }> {
  if (typeof zupanija !== "string" || typeof nadimak !== "string") return { greska: "Neispravan zahtjev." };
  const r = await postaviKupca(zupanija, nadimak);
  if ("ok" in r) {
    revalidatePath("/");
    revalidatePath("/igraj");
  }
  return r;
}

export async function osnuj(_prije: StanjeForme, fd: FormData): Promise<StanjeForme> {
  const r = await osnujLigu(String(fd.get("naziv") ?? ""));
  if ("greska" in r) return { greska: r.greska };
  redirect(`/liga/${r.liga.kod}`);
}

export async function udji(_prije: StanjeForme, fd: FormData): Promise<StanjeForme> {
  const r = await udjiULigu(String(fd.get("kod") ?? ""));
  if ("greska" in r) return { greska: r.greska };
  redirect(`/liga/${r.liga.kod}`);
}
