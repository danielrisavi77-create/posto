import type { Metadata } from "next";
import { Papir, Vrh } from "@/components/Zajednicko";

export const metadata: Metadata = { title: "Privatnost | Pošto?" };

// NACRT: prije javne objave upisati voditelja obrade i kontakt te dati pravniku na provjeru.
const VODITELJ = process.env.POSTO_VODITELJ || "[UPISATI: naziv i adresa voditelja obrade]";
const KONTAKT = process.env.POSTO_KONTAKT || "[UPISATI: e-adresa za upite]";

export default function Privatnost() {
  return (
    <>
      <Vrh />
      <Papir oznaka="Privatnost">
        <div className="clanak" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1>Privatnost</h1>
          <p>Pošto? se igra bez prijave. Ne tražimo ime, e-adresu ni broj mobitela.</p>

          <h2>Što spremamo</h2>
          <p>
            Nasumičnu oznaku uređaja (kolačić <code>posto_id</code>), županiju koju odabereš, nadimak ako ga upišeš, tvoje odgovore i bodove te lige u koje uđeš. Nadimak i županiju vide drugi igrači u dvoboju, na ljestvicama i na linku izazova.
          </p>

          <h2>Kolačići</h2>
          <p>
            Koristimo dva kolačića nužna za rad igre: <code>posto_id</code> pamti tvoju igru i niz (do 400 dana), a <code>posto_izazov</code> pamti tko te izazvao (jedan dan). Postavka zvuka sprema se samo u tvom pregledniku. Nema reklamnih ni analitičkih kolačića.
          </p>

          <h2>IP adresa</h2>
          <p>Radi zaštite od zlouporabe brojimo zahtjeve po mreži. IP adresu ne spremamo u izvornom obliku, nego samo njezin sažetak, i brišemo ga najkasnije unutar dva dana.</p>

          <h2>Tvoja prava</h2>
          <p>Možeš tražiti uvid u podatke ili njihovo brisanje. Javi se na {KONTAKT}. Brisanjem kolačića u pregledniku prekidaš vezu između uređaja i spremljenih igara.</p>

          <h2>Voditelj obrade</h2>
          <p>{VODITELJ}</p>
        </div>
      </Papir>
    </>
  );
}
