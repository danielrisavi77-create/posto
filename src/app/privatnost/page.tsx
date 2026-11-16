import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privatnost | Pošto?" };

// NACRT: prije javne objave upisati voditelja obrade i kontakt te dati pravniku na provjeru.
const VODITELJ = process.env.POSTO_VODITELJ ?? "[UPISATI: naziv i adresa voditelja obrade]";
const KONTAKT = process.env.POSTO_KONTAKT ?? "[UPISATI: e-adresa za upite]";

export default function Privatnost() {
  return (
    <>
      <div className="logo mali" style={{ alignSelf: "flex-start" }}>
        POŠTO?
      </div>
      <section className="kartica">
        <h1 className="artikl">Privatnost</h1>
        <p>Pošto? se igra bez prijave. Ne tražimo ime, e-adresu ni broj mobitela.</p>

        <h2 className="naslov-bloka">Što spremamo</h2>
        <p>
          Nasumičnu oznaku uređaja (kolačić <code>posto_id</code>), županiju koju odabereš, nadimak ako ga upišeš, tvoje pogotke i bodove. Nadimak i županija vide se drugim igračima u dvoboju i na linku izazova.
        </p>

        <h2 className="naslov-bloka">Kolačići</h2>
        <p>
          Koristimo dva kolačića nužna za rad igre: <code>posto_id</code> pamti tvoju igru i niz (traje do 400 dana), a <code>posto_izazov</code> pamti tko te izazvao (traje jedan dan). Nema reklamnih ni analitičkih kolačića.
        </p>

        <h2 className="naslov-bloka">IP adresa</h2>
        <p>Radi zaštite od zlouporabe brojimo zahtjeve po mreži. IP adresu ne spremamo u izvornom obliku, nego samo njezin sažetak, i brišemo ga unutar jednog dana.</p>

        <h2 className="naslov-bloka">Tvoja prava</h2>
        <p>
          Možeš tražiti uvid u podatke ili njihovo brisanje. Javi se na {KONTAKT}. Brisanjem kolačića u pregledniku prekidaš vezu između uređaja i spremljenih igara.
        </p>

        <h2 className="naslov-bloka">Voditelj obrade</h2>
        <p>{VODITELJ}</p>

        <Link className="gumb sporedni" href="/" style={{ textAlign: "center", textDecoration: "none" }}>
          Natrag na igru
        </Link>
      </section>
    </>
  );
}
