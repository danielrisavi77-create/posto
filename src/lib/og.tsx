// SAMO SERVER. Slike računa: pregled linka (1200x630) i slika za dijeljenje (1080x1350).
// Na slikama nikad nema današnjih cijena, samo igračevi odgovori i bodovi: slika ne smije pokvariti igru onome tko je dobije.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Razred } from "./bodovanje";

export const VELICINA = { width: 1200, height: 630 };
export const VELICINA_USPRAVNO = { width: 1080, height: 1350 };

const BOJE: Record<Razred, string> = { g: "#1D7A46", y: "#F5B700", o: "#F47B20", r: "#C9142B" };
const STOL = "#B9CBE6";
const PAPIR = "#FCFBF7";
const TISAK = "#2B2832";
const KEMIJSKA = "#1B3FA6";
const CRVENA = "#C9142B";

async function fontovi() {
  const ucitaj = (ime: string) => readFile(join(process.cwd(), "assets", "fonts", ime));
  const [n1, n2, r1, r2, t1, t2] = await Promise.all([
    ucitaj("barlow-condensed-latin-800-normal.woff"), ucitaj("barlow-condensed-latin-ext-800-normal.woff"),
    ucitaj("caveat-latin-700-normal.woff"), ucitaj("caveat-latin-ext-700-normal.woff"),
    ucitaj("inconsolata-latin-500-normal.woff"), ucitaj("inconsolata-latin-ext-500-normal.woff"),
  ]);
  return [
    { name: "Naslov", data: n1, weight: 800 as const, style: "normal" as const },
    { name: "NaslovExt", data: n2, weight: 800 as const, style: "normal" as const },
    { name: "Ruka", data: r1, weight: 700 as const, style: "normal" as const },
    { name: "RukaExt", data: r2, weight: 700 as const, style: "normal" as const },
    { name: "Tisak", data: t1, weight: 500 as const, style: "normal" as const },
    { name: "TisakExt", data: t2, weight: 500 as const, style: "normal" as const },
  ];
}

const F_NASLOV = "Naslov, NaslovExt";
const F_RUKA = "Ruka, RukaExt";
const F_TISAK = "Tisak, TisakExt";

function Znak({ velicina }: { velicina: number }) {
  return (
    <div style={{ display: "flex", fontFamily: F_NASLOV, fontSize: velicina, lineHeight: 1, color: CRVENA, background: "#FFDF3A", padding: `${velicina * 0.1}px ${velicina * 0.32}px ${velicina * 0.16}px`, borderRadius: 8, transform: "rotate(-3deg)" }}>
      Pošto?
    </div>
  );
}

function Kvadrati({ razredi, velicina }: { razredi: Razred[]; velicina: number }) {
  return (
    <div style={{ display: "flex" }}>
      {razredi.map((r, i) => (
        <div key={i} style={{ width: velicina, height: velicina, marginRight: velicina * 0.18, background: BOJE[r], borderRadius: velicina * 0.12 }} />
      ))}
    </div>
  );
}

/** Opća slika za početnu stranicu. */
export async function slikaOpca(): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: STOL, padding: 40 }}>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPIR, padding: 48, color: TISAK, transform: "rotate(-1deg)" }}>
          <div style={{ display: "flex" }}>
            <Znak velicina={84} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: F_TISAK, fontSize: 36 }}>Svaki dan jedan stari račun u kunama</div>
            <div style={{ display: "flex", fontFamily: F_NASLOV, fontSize: 104, lineHeight: 1.05 }}>Pošto je to danas?</div>
          </div>
          <div style={{ display: "flex", fontFamily: F_RUKA, fontSize: 56, color: KEMIJSKA }}>Tvoja županija protiv ostalih.</div>
        </div>
      </div>
    ),
    { ...VELICINA, fonts: await fontovi() },
  );
}

export type PodaciIzazova = {
  ime: string;
  zupanija: string;
  naslov: string;
  dan: number;
  ukupno: number;
  razredi: Razred[];
  /** npr. "Nutella: 4,00 €" (igračev odgovor, ne cijena) */
  mamac: string;
  stavke: { ime: string; razred: Razred; bodovi: number }[];
  tip: string;
};

/** Pregled linka izazova: vodoravno. */
export async function slikaIzazova(s: PodaciIzazova): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: STOL, padding: 40 }}>
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPIR, padding: 44, color: TISAK, transform: "rotate(-1deg)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Znak velicina={76} />
            <div style={{ display: "flex", fontFamily: F_NASLOV, fontSize: 112, lineHeight: 1 }}>{s.ukupno}/500</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: F_TISAK, fontSize: 34 }}>
              {s.ime} ({s.zupanija}) kaže:
            </div>
            <div style={{ display: "flex", fontFamily: F_RUKA, fontSize: s.mamac.length > 26 ? 84 : 104, lineHeight: 1.05, color: KEMIJSKA }}>{s.mamac}</div>
            <div style={{ display: "flex", fontFamily: F_RUKA, fontSize: 64, lineHeight: 1, color: CRVENA }}>A ti? Pošto je to danas?</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Kvadrati razredi={s.razredi} velicina={64} />
            <div style={{ display: "flex", fontFamily: F_TISAK, fontSize: 30 }}>{s.naslov}</div>
          </div>
        </div>
      </div>
    ),
    { ...VELICINA, fonts: await fontovi() },
  );
}

/** Slika računa za dijeljenje: uspravno, kao pravi račun. */
export async function slikaRacuna(s: PodaciIzazova): Promise<ImageResponse> {
  const crta = () => <div style={{ display: "flex", width: "100%", borderTop: `3px dashed ${TISAK}`, opacity: 0.5, margin: "18px 0" }} />;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: STOL }}>
        <div style={{ width: 900, display: "flex", flexDirection: "column", background: PAPIR, padding: "56px 56px 64px", color: TISAK, fontFamily: F_TISAK, fontSize: 38, transform: "rotate(-1.5deg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Znak velicina={72} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 30 }}>
              <div style={{ display: "flex" }}>Račun br. {s.dan}</div>
              <div style={{ display: "flex" }}>{s.zupanija}</div>
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: F_NASLOV, fontSize: 60, lineHeight: 1.05, marginTop: 34 }}>{s.naslov}</div>
          <div style={{ display: "flex", fontSize: 32 }}>Kupac: {s.ime}</div>
          {crta()}
          {s.stavke.map((st) => (
            <div key={st.ime} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex" }}>{st.ime.length > 26 ? st.ime.slice(0, 25) + "." : st.ime}</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, background: BOJE[st.razred], borderRadius: 6, marginRight: 16 }} />
                <div style={{ display: "flex", width: 90, justifyContent: "flex-end" }}>+{st.bodovi}</div>
              </div>
            </div>
          ))}
          {crta()}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 40 }}>UKUPNO BODOVA</div>
            <div style={{ display: "flex", fontFamily: F_NASLOV, fontSize: 92, lineHeight: 1 }}>{s.ukupno}/500</div>
          </div>
          {crta()}
          <div style={{ display: "flex", fontSize: 32 }}>Kažem da je</div>
          <div style={{ display: "flex", fontFamily: F_RUKA, fontSize: s.mamac.length > 24 ? 80 : 100, lineHeight: 1.05, color: KEMIJSKA }}>{s.mamac}</div>
          <div style={{ display: "flex", fontFamily: F_RUKA, fontSize: 70, lineHeight: 1, color: CRVENA }}>A ti? Pošto je to danas?</div>
          <div style={{ display: "flex", alignSelf: "center", marginTop: 34, fontFamily: F_NASLOV, fontSize: 58, lineHeight: 1, color: CRVENA, border: `7px solid ${CRVENA}`, borderRadius: 12, padding: "12px 30px 16px", transform: "rotate(-6deg)", textTransform: "uppercase" }}>
            {s.tip}
          </div>
        </div>
      </div>
    ),
    { ...VELICINA_USPRAVNO, fonts: await fontovi() },
  );
}
