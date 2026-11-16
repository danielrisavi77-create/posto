// SAMO SERVER. Slike za pregled linka (WhatsApp, Viber, društvene mreže).
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Razred } from "./bodovanje";

export const VELICINA = { width: 1200, height: 630 };

const BOJE: Record<Razred, string> = { g: "#1E9E55", y: "#F5B700", o: "#F47B20", r: "#E3122B" };

async function font(ime: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "assets", "fonts", ime));
}

type Sadrzaj = {
  /** mali red iznad naslova */
  nadnaslov: string;
  naslov: string;
  /** obojeni kvadrati rezultata; izostavi za opću sliku */
  razredi?: Razred[];
  /** veliki broj desno, npr. "412/500" */
  broj?: string;
  podnozje: string;
};

export async function slika(s: Sadrzaj): Promise<ImageResponse> {
  const [anton, antonExt, archivo, archivoExt] = await Promise.all([
    font("anton-latin-400-normal.woff"),
    font("anton-latin-ext-400-normal.woff"),
    font("archivo-latin-600-normal.woff"),
    font("archivo-latin-ext-600-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFD400", padding: 56, fontFamily: "Archivo, ArchivoExt", color: "#14110F" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Anton, AntonExt", fontSize: 92, color: "#fff", background: "#E3122B", border: "6px solid #14110F", padding: "0 28px", transform: "rotate(-3deg)", boxShadow: "10px 10px 0 #14110F" }}>
            POŠTO?
          </div>
          {s.broj ? (
            <div style={{ display: "flex", fontFamily: "Anton, AntonExt", fontSize: 120, lineHeight: 1 }}>{s.broj}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 36, marginBottom: 6 }}>{s.nadnaslov}</div>
          <div style={{ display: "flex", fontFamily: "Anton, AntonExt", fontSize: s.naslov.length > 26 ? 76 : 96, lineHeight: 1.05, textTransform: "uppercase" }}>{s.naslov}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {(s.razredi ?? []).map((r, i) => (
              <div key={i} style={{ width: 76, height: 76, marginRight: 14, background: BOJE[r], border: "5px solid #14110F", borderRadius: 10 }} />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 34, background: "#14110F", color: "#FFD400", padding: "10px 22px", borderRadius: 12 }}>{s.podnozje}</div>
        </div>
      </div>
    ),
    {
      ...VELICINA,
      fonts: [
        { name: "Anton", data: anton, weight: 400, style: "normal" },
        { name: "AntonExt", data: antonExt, weight: 400, style: "normal" },
        { name: "Archivo", data: archivo, weight: 600, style: "normal" },
        { name: "ArchivoExt", data: archivoExt, weight: 600, style: "normal" },
      ],
    },
  );
}
