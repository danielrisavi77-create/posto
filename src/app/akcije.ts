"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pogodiRundu, zapamtiIzazov, zapocni, type RezultatPogotka } from "@/lib/igra";
import { osnujLigu, udjiULigu } from "@/lib/liga";

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

export async function prihvatiIzazov(fd: FormData): Promise<void> {
  await zapamtiIzazov(String(fd.get("kod") ?? ""));
  redirect("/");
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
