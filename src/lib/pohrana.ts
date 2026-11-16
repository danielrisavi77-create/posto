// SAMO SERVER. Sloj pohrane s dvije izvedbe: Supabase (produkcija) i memorija (lokalni razvoj).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export type Bot = { ime: string; pogodci: number[] };

export type Igra = {
  id: string;
  kod: string;
  dan: number;
  /** oznaka računa po kojem se igra (vidi racuni.ts) */
  racun: string;
  sezona: string;
  igracId: string;
  nadimak: string;
  zupanija: string;
  pogodci: number[];
  bodovi: number[];
  ukupno: number;
  gotovo: boolean;
  /** indeks stavke na kojoj je odigrana dupla, ili null */
  dupla: number | null;
  protivnikId: string | null;
  protivnikBot: Bot | null;
};

export type Igrac = { id: string; nadimak: string; zupanija: string };
export type RedLige = { zupanija: string; prosjek: number; igara: number };
export type RedIgraca = { igracId: string; nadimak: string; zupanija: string; bodovi: number; igara: number };
export type Liga = { id: string; kod: string; naziv: string; vlasnik: string };

export type NovaIgra = Pick<Igra, "kod" | "dan" | "racun" | "sezona" | "igracId" | "nadimak" | "zupanija" | "protivnikId" | "protivnikBot">;

export interface Pohrana {
  igrac(id: string): Promise<Igrac | null>;
  spremiIgraca(i: Igrac): Promise<void>;
  igraZaDan(igracId: string, dan: number): Promise<Igra | null>;
  igraPoKodu(kod: string): Promise<Igra | null>;
  igraPoId(id: string): Promise<Igra | null>;
  /** Vraća postojeću igru ako ju je igrač za taj dan već započeo. */
  stvoriIgru(n: NovaIgra): Promise<Igra>;
  /** null znači da runda nije bila na redu (dvostruki klik, drugi tab, gotova igra). */
  dodajPogodak(igraId: string, indeks: number, vrijednost: number, bodovi: number, zadnji: boolean, dupla: boolean): Promise<Igra | null>;
  /** Upis županije i nadimka u igru započetu bez njih. */
  azurirajKupcaIgre(igraId: string, zupanija: string, nadimak: string): Promise<void>;
  /** Prosjek po županiji za jedan dan (derbi dana). */
  ligaDana(dan: number): Promise<RedLige[]>;
  /** Odgovori svih igrača na računu dana, za usporedbu po stavkama. */
  pogodciDana(dan: number, racun: string): Promise<{ igracId: string; pogodci: number[] }[]>;
  nasumicniProtivnik(dan: number, zupanija: string, igracId: string): Promise<Igra | null>;
  ligaSezone(sezona: string): Promise<RedLige[]>;
  igreSezone(igracId: string, sezona: string): Promise<{ dan: number; ukupno: number }[]>;
  /** Sve završene igre jednog igrača (za statistiku i Veliki račun). */
  sveIgre(igracId: string): Promise<Igra[]>;
  /** Najbolji igrači dana; izjednačene razdvaja raniji završetak. */
  topDana(dan: number, limit: number): Promise<RedIgraca[]>;
  /** Mjesto rezultata među svim završenim igrama dana i ukupan broj igrača. */
  mjestoDana(dan: number, ukupno: number): Promise<{ mjesto: number; igraca: number }>;
  topSezone(sezona: string, limit: number): Promise<RedIgraca[]>;
  stvoriLigu(l: { kod: string; naziv: string; vlasnik: string }): Promise<Liga>;
  ligaPoKodu(kod: string): Promise<Liga | null>;
  uclani(ligaId: string, igracId: string): Promise<void>;
  ligeIgraca(igracId: string): Promise<Liga[]>;
  clanoviLige(ligaId: string): Promise<Igrac[]>;
  sezonaZaIgrace(sezona: string, ids: string[]): Promise<RedIgraca[]>;
  danZaIgrace(dan: number, ids: string[]): Promise<RedIgraca[]>;
  /** Ograničenje zahtjeva: true ako je ključ unutar granice u tekućem prozoru. */
  dopusti(kljuc: string, limit: number, sekundi: number): Promise<boolean>;
}

/* ---------- Supabase ---------- */

type Red = {
  id: string; kod: string; dan: number; racun: string; sezona: string; igrac_id: string; nadimak: string; zupanija: string;
  pogodci: (number | string)[]; bodovi: number[]; ukupno: number; gotovo: boolean; dupla?: number | null;
  protivnik_id: string | null; protivnik_bot: Bot | null;
};

function izReda(r: Red): Igra {
  return {
    id: r.id, kod: r.kod, dan: r.dan, racun: r.racun ?? "", sezona: r.sezona, igracId: r.igrac_id, nadimak: r.nadimak, zupanija: r.zupanija,
    pogodci: (r.pogodci ?? []).map(Number), bodovi: r.bodovi ?? [], ukupno: r.ukupno, gotovo: r.gotovo, dupla: r.dupla ?? null,
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
      kod: n.kod, dan: n.dan, racun: n.racun, sezona: n.sezona, igrac_id: n.igracId, nadimak: n.nadimak, zupanija: n.zupanija,
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
  async azurirajKupcaIgre(igraId: string, zupanija: string, nadimak: string) {
    const { error } = await this.db.from("igre").update({ zupanija, nadimak }).eq("id", igraId);
    greska("azurirajKupcaIgre", error);
  }
  async ligaDana(dan: number) {
    const { data, error } = await this.db.from("liga_dan").select("zupanija,prosjek,igara").eq("dan", dan);
    greska("ligaDana", error);
    return (data as RedLige[] | null) ?? [];
  }
  async pogodciDana(dan: number, racun: string) {
    const { data, error } = await this.db.from("igre").select("igrac_id,pogodci").eq("dan", dan).eq("racun", racun).order("stvoreno", { ascending: false }).limit(3000);
    greska("pogodciDana", error);
    return ((data as { igrac_id: string; pogodci: (number | string)[] }[] | null) ?? []).map((r) => ({ igracId: r.igrac_id, pogodci: (r.pogodci ?? []).map(Number) }));
  }
  async dodajPogodak(igraId: string, indeks: number, vrijednost: number, bodovi: number, zadnji: boolean, dupla: boolean) {
    const { data, error } = await this.db.rpc("dodaj_pogodak", {
      p_igra: igraId, p_indeks: indeks, p_vrijednost: vrijednost, p_bodovi: bodovi, p_zadnji: zadnji, p_dupla: dupla,
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
  async dopusti(kljuc: string, limit: number, sekundi: number) {
    const { data, error } = await this.db.rpc("dopusti", { p_kljuc: kljuc, p_limit: limit, p_sekundi: sekundi });
    greska("dopusti", error);
    return data === true;
  }
  async sveIgre(igracId: string) {
    const { data, error } = await this.db.from("igre").select("*").eq("igrac_id", igracId).eq("gotovo", true).order("dan", { ascending: true }).limit(1000);
    greska("sveIgre", error);
    return ((data as Red[] | null) ?? []).map(izReda);
  }
  async topDana(dan: number, limit: number) {
    const { data, error } = await this.db.from("igre").select("igrac_id,nadimak,zupanija,ukupno").eq("dan", dan).eq("gotovo", true)
      .order("ukupno", { ascending: false }).order("zavrseno", { ascending: true }).limit(limit);
    greska("topDana", error);
    return ((data as { igrac_id: string; nadimak: string; zupanija: string; ukupno: number }[] | null) ?? [])
      .map((r) => ({ igracId: r.igrac_id, nadimak: r.nadimak, zupanija: r.zupanija, bodovi: r.ukupno, igara: 1 }));
  }
  async mjestoDana(dan: number, ukupno: number) {
    const bolji = await this.db.from("igre").select("id", { count: "exact", head: true }).eq("dan", dan).eq("gotovo", true).gt("ukupno", ukupno);
    greska("mjestoDana", bolji.error);
    const svi = await this.db.from("igre").select("id", { count: "exact", head: true }).eq("dan", dan).eq("gotovo", true);
    greska("mjestoDana", svi.error);
    return { mjesto: (bolji.count ?? 0) + 1, igraca: svi.count ?? 0 };
  }
  async topSezone(sezona: string, limit: number) {
    const { data, error } = await this.db.from("ljestvica_sezona").select("igrac_id,nadimak,zupanija,bodovi,igara").eq("sezona", sezona)
      .order("bodovi", { ascending: false }).limit(limit);
    greska("topSezone", error);
    return ((data as RedSezone[] | null) ?? []).map(izSezone);
  }
  async stvoriLigu(l: { kod: string; naziv: string; vlasnik: string }) {
    const { data, error } = await this.db.from("lige").insert({ kod: l.kod, naziv: l.naziv, vlasnik: l.vlasnik }).select("id,kod,naziv,vlasnik").single();
    greska("stvoriLigu", error);
    await this.uclani((data as Liga).id, l.vlasnik);
    return data as Liga;
  }
  async ligaPoKodu(kod: string) {
    const { data, error } = await this.db.from("lige").select("id,kod,naziv,vlasnik").eq("kod", kod).maybeSingle();
    greska("ligaPoKodu", error);
    return (data as Liga | null) ?? null;
  }
  async uclani(ligaId: string, igracId: string) {
    const { error } = await this.db.from("lige_clanovi").upsert({ liga_id: ligaId, igrac_id: igracId }, { onConflict: "liga_id,igrac_id", ignoreDuplicates: true });
    greska("uclani", error);
  }
  async ligeIgraca(igracId: string) {
    const c = await this.db.from("lige_clanovi").select("liga_id").eq("igrac_id", igracId);
    greska("ligeIgraca", c.error);
    const ids = ((c.data as { liga_id: string }[] | null) ?? []).map((r) => r.liga_id);
    if (!ids.length) return [];
    const { data, error } = await this.db.from("lige").select("id,kod,naziv,vlasnik").in("id", ids).order("stvorena", { ascending: true });
    greska("ligeIgraca", error);
    return (data as Liga[] | null) ?? [];
  }
  async clanoviLige(ligaId: string) {
    const c = await this.db.from("lige_clanovi").select("igrac_id").eq("liga_id", ligaId).limit(200);
    greska("clanoviLige", c.error);
    const ids = ((c.data as { igrac_id: string }[] | null) ?? []).map((r) => r.igrac_id);
    if (!ids.length) return [];
    const { data, error } = await this.db.from("igraci").select("id,nadimak,zupanija").in("id", ids);
    greska("clanoviLige", error);
    return (data as Igrac[] | null) ?? [];
  }
  async sezonaZaIgrace(sezona: string, ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await this.db.from("ljestvica_sezona").select("igrac_id,nadimak,zupanija,bodovi,igara").eq("sezona", sezona).in("igrac_id", ids);
    greska("sezonaZaIgrace", error);
    return ((data as RedSezone[] | null) ?? []).map(izSezone);
  }
  async danZaIgrace(dan: number, ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await this.db.from("igre").select("igrac_id,nadimak,zupanija,ukupno").eq("dan", dan).eq("gotovo", true).in("igrac_id", ids);
    greska("danZaIgrace", error);
    return ((data as { igrac_id: string; nadimak: string; zupanija: string; ukupno: number }[] | null) ?? [])
      .map((r) => ({ igracId: r.igrac_id, nadimak: r.nadimak, zupanija: r.zupanija, bodovi: r.ukupno, igara: 1 }));
  }
}

type RedSezone = { igrac_id: string; nadimak: string; zupanija: string; bodovi: number; igara: number };
function izSezone(r: RedSezone): RedIgraca {
  return { igracId: r.igrac_id, nadimak: r.nadimak, zupanija: r.zupanija, bodovi: r.bodovi, igara: r.igara };
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
    const g: Igra = { ...n, id: randomUUID(), pogodci: [], bodovi: [], ukupno: 0, gotovo: false, dupla: null };
    this.igre.set(g.id, g);
    return structuredClone(g);
  }
  async azurirajKupcaIgre(igraId: string, zupanija: string, nadimak: string) {
    const g = this.igre.get(igraId);
    if (g) { g.zupanija = zupanija; g.nadimak = nadimak; }
  }
  async ligaDana(dan: number) {
    const m = new Map<string, number[]>();
    for (const g of this.igre.values()) if (g.gotovo && g.dan === dan && g.zupanija) m.set(g.zupanija, [...(m.get(g.zupanija) ?? []), g.ukupno]);
    return [...m].map(([zupanija, v]) => ({ zupanija, prosjek: Math.round(v.reduce((a, b) => a + b, 0) / v.length), igara: v.length }));
  }
  async pogodciDana(dan: number, racun: string) {
    return [...this.igre.values()].filter((g) => g.dan === dan && g.racun === racun).map((g) => ({ igracId: g.igracId, pogodci: [...g.pogodci] }));
  }
  async dodajPogodak(igraId: string, indeks: number, vrijednost: number, bodovi: number, zadnji: boolean, dupla: boolean) {
    const g = this.igre.get(igraId);
    if (!g || g.gotovo || g.pogodci.length !== indeks) return null;
    if (dupla && g.dupla !== null) return null;
    if (dupla) g.dupla = indeks;
    g.pogodci.push(vrijednost); g.bodovi.push(bodovi); g.ukupno += bodovi; g.gotovo = zadnji;
    return structuredClone(g);
  }
  async nasumicniProtivnik(dan: number, zupanija: string, igracId: string) {
    const k = [...this.igre.values()].filter((g) => g.dan === dan && g.gotovo && g.zupanija !== zupanija && g.igracId !== igracId);
    return k.length ? structuredClone(k[Math.floor(Math.random() * k.length)]) : null;
  }
  async ligaSezone(sezona: string) {
    const m = new Map<string, number[]>();
    for (const g of this.igre.values()) if (g.gotovo && g.sezona === sezona && g.zupanija) m.set(g.zupanija, [...(m.get(g.zupanija) ?? []), g.ukupno]);
    return [...m].map(([zupanija, v]) => ({ zupanija, prosjek: Math.round(v.reduce((a, b) => a + b, 0) / v.length), igara: v.length }));
  }
  async igreSezone(igracId: string, sezona: string) {
    return [...this.igre.values()].filter((g) => g.igracId === igracId && g.sezona === sezona && g.gotovo).map((g) => ({ dan: g.dan, ukupno: g.ukupno }));
  }
  private lige = new Map<string, Liga>();
  private clanstva = new Map<string, Set<string>>();
  private red(g: Igra): RedIgraca { return { igracId: g.igracId, nadimak: g.nadimak, zupanija: g.zupanija, bodovi: g.ukupno, igara: 1 }; }
  private gotove() { return [...this.igre.values()].filter((g) => g.gotovo); }
  private zbroji(igre: Igra[]): RedIgraca[] {
    const m = new Map<string, RedIgraca>();
    for (const g of igre) {
      const i = this.igraci.get(g.igracId);
      const r = m.get(g.igracId) ?? { igracId: g.igracId, nadimak: i?.nadimak ?? g.nadimak, zupanija: i?.zupanija ?? g.zupanija, bodovi: 0, igara: 0 };
      r.bodovi += g.ukupno; r.igara += 1; m.set(g.igracId, r);
    }
    return [...m.values()];
  }
  async sveIgre(igracId: string) { return this.gotove().filter((g) => g.igracId === igracId).sort((a, b) => a.dan - b.dan).map((g) => structuredClone(g)); }
  async topDana(dan: number, limit: number) { return this.gotove().filter((g) => g.dan === dan).sort((a, b) => b.ukupno - a.ukupno).slice(0, limit).map((g) => this.red(g)); }
  async mjestoDana(dan: number, ukupno: number) {
    const d = this.gotove().filter((g) => g.dan === dan);
    return { mjesto: d.filter((g) => g.ukupno > ukupno).length + 1, igraca: d.length };
  }
  async topSezone(sezona: string, limit: number) { return this.zbroji(this.gotove().filter((g) => g.sezona === sezona)).sort((a, b) => b.bodovi - a.bodovi).slice(0, limit); }
  async stvoriLigu(l: { kod: string; naziv: string; vlasnik: string }) {
    const liga: Liga = { id: randomUUID(), ...l };
    this.lige.set(liga.id, liga); this.clanstva.set(liga.id, new Set([l.vlasnik]));
    return { ...liga };
  }
  async ligaPoKodu(kod: string) { for (const l of this.lige.values()) if (l.kod === kod) return { ...l }; return null; }
  async uclani(ligaId: string, igracId: string) { this.clanstva.get(ligaId)?.add(igracId); }
  async ligeIgraca(igracId: string) { return [...this.lige.values()].filter((l) => this.clanstva.get(l.id)?.has(igracId)).map((l) => ({ ...l })); }
  async clanoviLige(ligaId: string) { return [...(this.clanstva.get(ligaId) ?? [])].map((id) => this.igraci.get(id)).filter((i): i is Igrac => !!i).map((i) => ({ ...i })); }
  async sezonaZaIgrace(sezona: string, ids: string[]) { return this.zbroji(this.gotove().filter((g) => g.sezona === sezona && ids.includes(g.igracId))); }
  async danZaIgrace(dan: number, ids: string[]) { return this.gotove().filter((g) => g.dan === dan && ids.includes(g.igracId)).map((g) => this.red(g)); }
  private brojaci = new Map<string, number>();
  async dopusti(kljuc: string, limit: number, sekundi: number) {
    const k = `${kljuc}:${Math.floor(Date.now() / 1000 / sekundi)}`;
    const n = (this.brojaci.get(k) ?? 0) + 1;
    this.brojaci.set(k, n);
    return n <= limit;
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
