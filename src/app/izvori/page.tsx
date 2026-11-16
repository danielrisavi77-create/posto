import type { Metadata } from "next";
import Link from "next/link";
import { Papir, Vrh } from "@/components/Zajednicko";

export const metadata: Metadata = { title: "Izvori i metoda | Pošto?" };

export default function Izvori() {
  return (
    <>
      <Vrh />
      <Papir oznaka="Izvori i metoda">
        <div className="clanak" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1>Odakle cijene</h1>
          <p>Svaka cijena u igri ima izvor koji možeš otvoriti. Poveznica se pokaže čim zaključaš svoj odgovor.</p>

          <h2>Računi iz prosinca 2022.</h2>
          <p>
            Stare cijene su prosječne maloprodajne cijene koje je Državni zavod za statistiku objavio za prosinac 2022., zadnji mjesec kune, u kunama i eurima.{" "}
            <a href="https://podaci.dzs.hr/hr/podaci/cijene/uvodenje-eura-prosjecne-maloprodajne-cijene/" target="_blank" rel="noopener noreferrer">
              Tablica DZS-a
            </a>
            .
          </p>
          <p>
            DZS je te prosjeke prestao objavljivati nakon prosinca 2023. Današnja cijena je zato procjena: zadnji objavljeni prosjek uvećan je za rast cijena te skupine proizvoda do rujna 2026., prema Eurostatovu harmoniziranom indeksu potrošačkih cijena za Hrvatsku. U igri je takva cijena uvijek označena riječju procjena.
          </p>

          <h2>Stariji računi</h2>
          <p>Računi iz 2016. i ranijih godina uspoređuju cijene iz kataloga, s tržnica i iz službenih cjenika, prema novinskim usporedbama koje navode svoju metodu. Izvor piše uz svaku stavku.</p>

          <h2>Plaće i mirovine</h2>
          <p>Plaće po županijama su DZS-ovi podaci: godišnji prosjek za 2022. i prosjek za prva tri mjeseca 2026. Od 2024. DZS plaće prati iz drugog izvora podataka, pa usporedba nije savršena, ali je najbolja službena.</p>

          <h2>Što igra nije</h2>
          <p>Nekoliko stavki na jednom računu nisu statistička košarica. Postoci na kraju računa pokazuju koliko se tvoj osjećaj za cijene razlikuje od podataka, a ne kolika je inflacija.</p>

          <p>
            Našao si grešku u cijeni? Javi nam, ispravit ćemo. <Link href="/privatnost">Kontakt je na stranici o privatnosti</Link>.
          </p>
        </div>
      </Papir>
    </>
  );
}
