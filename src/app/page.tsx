import Link from "next/link";
import { DerbiDana } from "@/components/DerbiDana";
import { Odbrojavanje } from "@/components/Odbrojavanje";
import { StariRacun, Vrh } from "@/components/Zajednicko";
import { danBroj, sekundiDoPonoci } from "@/lib/dan";
import { derbi } from "@/lib/derbi";
import { igracId } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { javniRacun, racunIgre, racunZaDan } from "@/lib/racuni";

export const dynamic = "force-dynamic";

/** Početna samo predstavlja igru i današnji račun. Igra se na /igraj. */
export default async function Pocetna() {
  const dan = danBroj();
  const db = pohrana();
  const id = await igracId();
  const igra = id ? await db.igraZaDan(id, dan) : null;
  const racun = javniRacun(igra ? racunIgre(igra) : racunZaDan(dan));
  const [igrac, danas, jucer] = await Promise.all([id ? db.igrac(id) : null, derbi(dan), dan > 1 ? derbi(dan - 1) : null]);
  const gotovo = !!igra?.gotovo;
  const uTijeku = !!igra && !gotovo;

  return (
    <>
      <Vrh />

      <section className="na-stolu uvod">
        <h1 className="naslov velik">Našao si stari račun u kunama. Pošto je to danas?</h1>
        <p className="prica">Svaki dan jedan račun i pet cijena. Pogađaš koliko iste stvari koštaju danas, a bodovi idu tebi i tvojoj županiji.</p>
      </section>

      {gotovo ? (
        <>
          <Link className="tipka velika na-stolu-tipka" href="/racun">
            Pogledaj svoj račun
          </Link>
          <p className="na-stolu odbrojavanje">
            Današnji račun si platio. Novi stiže za
            <Odbrojavanje sekundi={sekundiDoPonoci()} />
          </p>
        </>
      ) : (
        <Link className="tipka velika crvena na-stolu-tipka" href="/igraj">
          {uTijeku ? "Nastavi račun" : "Igraj današnji račun"}
        </Link>
      )}

      <section className="blok" aria-label="Današnji račun">
        <p className="na-stolu etiketa">
          Račun br. {dan}: <b>{racun.naslov}</b>
        </p>
        <StariRacun racun={racun} />
      </section>

      {!igrac ? (
        <section className="na-stolu kako" aria-label="Kako se igra">
          <h2 className="podnaslov">Kako se igra</h2>
          <ol className="upute">
            <li>Na računu su četiri stvari sa starim cijenama u kunama, a peta je na poleđini.</li>
            <li>Za svaku povučeš klizač na cijenu koju misliš da ima danas.</li>
            <li>Što si bliže, to više bodova. Jedan pokušaj dnevno, novi račun u ponoć.</li>
          </ol>
        </section>
      ) : null}

      <DerbiDana danas={danas} jucer={jucer} mojaZupanija={igrac?.zupanija || undefined} />
    </>
  );
}
