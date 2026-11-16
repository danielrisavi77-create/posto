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
        <h1 className="naslov velik">Iz koje su godine tvoje cijene?</h1>
        <p className="prica">Pogodi koliko iste stvari koštaju danas i saznaj iz koje su godine tvoje cijene. Jedan račun dnevno, manje od minute.</p>
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
            <li>Na računu su tri stvari sa starim cijenama u kunama, a četvrta je na poleđini.</li>
            <li>Za svaku povučeš klizač na cijenu koju misliš da ima danas.</li>
            <li>Na kraju dobiješ presudu: iz koje su godine tvoje cijene. Jedan pokušaj dnevno, novi račun u ponoć.</li>
            <li>Jednom po računu možeš igrati duplu: dvostruki bodovi ako si unutar 15 % cijene, inače nula.</li>
          </ol>
        </section>
      ) : null}

      <DerbiDana danas={danas} jucer={jucer} mojaZupanija={igrac?.zupanija || undefined} />
    </>
  );
}
