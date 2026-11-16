import Link from "next/link";
import { DerbiDana } from "@/components/DerbiDana";
import { Igra } from "@/components/Igra";
import { StariRacun, Vrh } from "@/components/Zajednicko";
import { danBroj } from "@/lib/dan";
import { derbi } from "@/lib/derbi";
import { igracId, otkrivenoDoSad, protivnikIgre } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { javniRacun, racunIgre, racunZaDan } from "@/lib/racuni";

export const dynamic = "force-dynamic";

export default async function Pocetna() {
  const dan = danBroj();
  const db = pohrana();
  const id = await igracId();
  const igra = id ? await db.igraZaDan(id, dan) : null;
  // Započeta igra ostaje na svom računu i ako se raspored u međuvremenu promijenio.
  const racun = javniRacun(igra ? racunIgre(igra) : racunZaDan(dan));
  const [igrac, danas, jucer, prot] = await Promise.all([
    id ? db.igrac(id) : null, derbi(dan), dan > 1 ? derbi(dan - 1) : null, igra && !igra.gotovo ? protivnikIgre(igra) : null,
  ]);
  const uTijeku = !!igra && !igra.gotovo;

  // Raspored elemenata je isti prije i tijekom igre. Prvi odgovor otvara račun i osvježava stranicu,
  // a <Igra> mora ostati na istom mjestu u stablu da ne izgubi stanje (zato i stalni key).
  return (
    <>
      <Vrh />
      <section className="na-stolu">
        <h1 className="naslov">{racun.naslov}</h1>
        <p className="prica">{racun.prica}</p>
        {!igrac ? (
          <ol className="upute">
            <li>Na računu su četiri stvari sa starim cijenama.</li>
            <li>Za svaku upišeš koliko košta danas.</li>
            <li>Bodovi idu tebi i tvojoj županiji.</li>
          </ol>
        ) : null}
      </section>

      <StariRacun racun={racun} />

      {igra?.gotovo ? (
        <>
          <Link className="tipka na-stolu-tipka" href="/racun">
            Pogledaj današnji račun
          </Link>
          <p className="napomena na-stolu">Ovaj račun si već platio. Novi stiže u ponoć.</p>
        </>
      ) : (
        <Igra
          key="igra"
          dan={dan}
          naslov={racun.naslov}
          set={racun.set}
          pocetno={uTijeku && prot ? otkrivenoDoSad(igra, prot) : []}
          protivnik={prot ? { ime: prot.ime, zupanija: prot.zupanija, bot: prot.bot } : null}
          zupanija={igra?.zupanija || igrac?.zupanija || ""}
          nadimak={igra?.nadimak || igrac?.nadimak || ""}
          duplaIskoristena={!!igra && igra.dupla !== null}
        />
      )}

      <DerbiDana danas={danas} jucer={jucer} mojaZupanija={igrac?.zupanija || undefined} />
    </>
  );
}
