// SAMO SERVER. Slike za pregled linka (WhatsApp, Viber, društvene mreže).
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Razred } from "./bodovanje";

export const VELICINA = { width: 1200, height: 630 };

const BOJE: Record<Razred, string> = { g: "#1D7A46", y: "#F5B700", o: "#F47B20", r: "#C9142B" };

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
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#B9CBE6", padding: 36 }}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FCFBF7", padding: 44, fontFamily: "Archivo, ArchivoExt", color: "#2B2832", boxShadow: "0 14px 0 rgba(30,40,70,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Anton, AntonExt", fontSize: 84, color: "#C9142B", background: "#FFDF3A", padding: "2px 30px 6px", borderRadius: 8, transform: "rotate(-3deg)" }}>
            Pošto?
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
              <div key={i} style={{ width: 76, height: 76, marginRight: 14, background: BOJE[r], borderRadius: 8 }} />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 34, background: "#2B2832", color: "#FCFBF7", padding: "10px 22px", borderRadius: 6 }}>{s.podnozje}</div>
        </div>
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
