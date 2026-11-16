// SAMO SERVER. Sloj pohrane s dvije izvedbe: Supabase (produkcija) i memorija (lokalni razvoj).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export type Bot = { ime: string; pogodci: number[] };

export type Igra = {
  id: string;
  kod: string;
  dan: number;
  sezona: string;
  igracId: string;
  nadimak: string;
  zupanija: string;
  pogodci: number[];
  bodovi: number[];
  ukupno: number;
  gotovo: boolean;
  protivnikId: string | null;
  protivnikBot: Bot | null;
};

export type Igrac = { id: string; nadimak: string; zupanija: string };
export type RedLige = { zupanija: string; prosjek: number; igara: number };

export type NovaIgra = Pick<Igra, "kod" | "dan" | "sezona" | "igracId" | "nadimak" | "zupanija" | "protivnikId" | "protivnikBot">;

export interface Pohrana {
  igrac(id: string): Promise<Igrac | null>;
  spremiIgraca(i: Igrac): Promise<void>;
  igraZaDan(igracId: string, dan: number): Promise<Igra | null>;
  igraPoKodu(kod: string): Promise<Igra | null>;
  igraPoId(id: string): Promise<Igra | null>;
  /** Vraća postojeću igru ako ju je igrač za taj dan već započeo. */
  stvoriIgru(n: NovaIgra): Promise<Igra>;
  /** null znači da runda nije bila na redu (dvostruki klik, drugi tab, gotova igra). */
  dodajPogodak(igraId: string, indeks: number, vrijednost: number, bodovi: number, zadnji: boolean): Promise<Igra | null>;
  nasumicniProtivnik(dan: number, zupanija: string, igracId: string): Promise<Igra | null>;
  ligaSezone(sezona: string): Promise<RedLige[]>;
  igreSezone(igracId: string, sezona: string): Promise<{ dan: number; ukupno: number }[]>;
}

/* ---------- Supabase ---------- */

type Red = {
  id: string; kod: string; dan: number; sezona: string; igrac_id: string; nadimak: string; zupanija: string;
  pogodci: (number | string)[]; bodovi: number[]; ukupno: number; gotovo: boolean;
  protivnik_id: string | null; protivnik_bot: Bot | null;
};

function izReda(r: Red): Igra {
  return {
    id: r.id, kod: r.kod, dan: r.dan, sezona: r.sezona, igracId: r.igrac_id, nadimak: r.nadimak, zupanija: r.zupanija,
    pogodci: (r.pogodci ?? []).map(Number), bodovi: r.bodovi ?? [], ukupno: r.ukupno, gotovo: r.gotovo,
    protivnikId: r.protivnik_id, protivnikBot: r.protivnik_bot,
  };
}

function greska(kontekst: string, e: { message: string } | null): void {
  if (e) throw new Error(`Supabase (${kontekst}): ${e.message}`);
}

class SupabasePohrana implements Pohrana {
  constructor(private db: SupabaseClient) {}

  async igrac(id: string) {
    const { data, error } = await this.db.from("igraci").select("id,nadimak,zupanija").eq("id", id).maybeSingle();
    greska("igrac", error);
    return (data as Igrac | null) ?? null;
  }
  async spremiIgraca(i: Igrac) {
    const { error } = await this.db.from("igraci").upsert({ id: i.id, nadimak: i.nadimak, zupanija: i.zupanija });
    greska("spremiIgraca", error);
  }
  async igraZaDan(igracId: string, dan: number) {
    const { data, error } = await this.db.from("igre").select("*").eq("igrac_id", igracId).eq("dan", dan).maybeSingle();
    greska("igraZaDan", error);
    return data ? izReda(data as Red) : null;
  }
  async igraPoKodu(kod: string) {
    const { data, error } = await this.db.from("igre").select("*").eq("kod", kod).maybeSingle();
    greska("igraPoKodu", error);
    return data ? izReda(data as Red) : null;
  }
  async igraPoId(id: string) {
    const { data, error } = await this.db.from("igre").select("*").eq("id", id).maybeSingle();
    greska("igraPoId", error);
    return data ? izReda(data as Red) : null;
  }
  async stvoriIgru(n: NovaIgra) {
    const { data, error } = await this.db.from("igre").insert({
      kod: n.kod, dan: n.dan, sezona: n.sezona, igrac_id: n.igracId, nadimak: n.nadimak, zupanija: n.zupanija,
      protivnik_id: n.protivnikId, protivnik_bot: n.protivnikBot,
    }).select("*").single();
    if (error) {
      // 23505 = unique (dan, igrac_id): igra već postoji (dva taba ili dvostruki klik)
      if (error.code === "23505") {
        const postojeca = await this.igraZaDan(n.igracId, n.dan);
        if (postojeca) return postojeca;
      }
      greska("stvoriIgru", error);
    }
    return izReda(data as Red);
  }
  async dodajPogodak(igraId: string, indeks: number, vrijednost: number, bodovi: number, zadnji: boolean) {
    const { data, error } = await this.db.rpc("dodaj_pogodak", {
      p_igra: igraId, p_indeks: indeks, p_vrijednost: vrijednost, p_bodovi: bodovi, p_zadnji: zadnji,
    });
    greska("dodajPogodak", error);
    const redovi = (data as Red[] | null) ?? [];
    return redovi.length ? izReda(redovi[0]) : null;
  }
  async nasumicniProtivnik(dan: number, zupanija: string, igracId: string) {
    const { data, error } = await this.db.rpc("nasumicni_protivnik", { p_dan: dan, p_zupanija: zupanija, p_igrac: igracId });
    greska("nasumicniProtivnik", error);
    const redovi = (data as Red[] | null) ?? [];
    return redovi.length ? izReda(redovi[0]) : null;
  }
  async ligaSezone(sezona: string) {
    const { data, error } = await this.db.from("liga_sezona").select("zupanija,prosjek,igara").eq("sezona", sezona);
    greska("ligaSezone", error);
    return (data as RedLige[] | null) ?? [];
  }
  async igreSezone(igracId: string, sezona: string) {
    const { data, error } = await this.db.from("igre").select("dan,ukupno").eq("igrac_id", igracId).eq("sezona", sezona).eq("gotovo", true);
    greska("igreSezone", error);
    return (data as { dan: number; ukupno: number }[] | null) ?? [];
  }
}

/* ---------- Memorija (samo lokalni razvoj) ---------- */

class MemorijskaPohrana implements Pohrana {
  private igraci = new Map<string, Igrac>();
  private igre = new Map<string, Igra>();

  async igrac(id: string) { return this.igraci.get(id) ?? null; }
  async spremiIgraca(i: Igrac) { this.igraci.set(i.id, { ...i }); }
  async igraZaDan(igracId: string, dan: number) {
    for (const g of this.igre.values()) if (g.igracId === igracId && g.dan === dan) return structuredClone(g);
    return null;
  }
  async igraPoKodu(kod: string) {
    for (const g of this.igre.values()) if (g.kod === kod) return structuredClone(g);
    return null;
  }
  async igraPoId(id: string) { const g = this.igre.get(id); return g ? structuredClone(g) : null; }
  async stvoriIgru(n: NovaIgra) {
    const postojeca = await this.igraZaDan(n.igracId, n.dan);
    if (postojeca) return postojeca;
    const g: Igra = { ...n, id: randomUUID(), pogodci: [], bodovi: [], ukupno: 0, gotovo: false };
    this.igre.set(g.id, g);
    return structuredClone(g);
  }
  async dodajPogodak(igraId: string, indeks: number, vrijednost: number, bodovi: number, zadnji: boolean) {
    const g = this.igre.get(igraId);
    if (!g || g.gotovo || g.pogodci.length !== indeks) return null;
    g.pogodci.push(vrijednost); g.bodovi.push(bodovi); g.ukupno += bodovi; g.gotovo = zadnji;
    return structuredClone(g);
  }
  async nasumicniProtivnik(dan: number, zupanija: string, igracId: string) {
    const k = [...this.igre.values()].filter((g) => g.dan === dan && g.gotovo && g.zupanija !== zupanija && g.igracId !== igracId);
    return k.length ? structuredClone(k[Math.floor(Math.random() * k.length)]) : null;
  }
  async ligaSezone(sezona: string) {
    const m = new Map<string, number[]>();
    for (const g of this.igre.values()) if (g.gotovo && g.sezona === sezona) m.set(g.zupanija, [...(m.get(g.zupanija) ?? []), g.ukupno]);
    return [...m].map(([zupanija, v]) => ({ zupanija, prosjek: Math.round(v.reduce((a, b) => a + b, 0) / v.length), igara: v.length }));
  }
  async igreSezone(igracId: string, sezona: string) {
    return [...this.igre.values()].filter((g) => g.igracId === igracId && g.sezona === sezona && g.gotovo).map((g) => ({ dan: g.dan, ukupno: g.ukupno }));
  }
}

/* ---------- Odabir izvedbe ---------- */

const g = globalThis as unknown as { __postoPohrana?: Pohrana };

export function pohrana(): Pohrana {
  if (g.__postoPohrana) return g.__postoPohrana;
  const url = process.env.SUPABASE_URL;
  const kljuc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && kljuc) {
    g.__postoPohrana = new SupabasePohrana(createClient(url, kljuc, { auth: { persistSession: false, autoRefreshToken: false } }));
  } else if (process.env.POSTO_MEMORIJA === "1" || process.env.NODE_ENV !== "production") {
    console.warn("[posto] Supabase nije podešen: koristim pohranu u memoriji. Podaci nestaju pri restartu.");
    g.__postoPohrana = new MemorijskaPohrana();
  } else {
    throw new Error("Nedostaju SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY.");
  }
  return g.__postoPohrana;
}
