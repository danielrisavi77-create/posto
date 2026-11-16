import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Igra } from "@/components/Igra";
import { Vrh } from "@/components/Zajednicko";
import { danBroj } from "@/lib/dan";
import { igracId, otkrivenoDoSad, protivnikIgre } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { javniRacun, racunIgre, racunZaDan } from "@/lib/racuni";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Današnji račun | Pošto?" };

export default async function Igraj() {
  const dan = danBroj();
  const db = pohrana();
  const id = await igracId();
  const igra = id ? await db.igraZaDan(id, dan) : null;
  if (igra?.gotovo) redirect("/racun");
  // Započeta igra ostaje na svom računu i ako se raspored u međuvremenu promijenio.
  const racun = javniRacun(igra ? racunIgre(igra) : racunZaDan(dan));
  const [igrac, prot] = await Promise.all([id ? db.igrac(id) : null, igra ? protivnikIgre(igra) : null]);

  // Raspored elemenata je isti prije i tijekom igre. Prvi odgovor otvara račun i osvježava stranicu,
  // a <Igra> mora ostati na istom mjestu u stablu da ne izgubi stanje (zato i stalni key).
  return (
    <>
      <Vrh />
      <section className="na-stolu uvod-igre">
        <h1 className="naslov">{racun.naslov}</h1>
        {!igra ? <p className="prica">{racun.prica}</p> : null}
      </section>

      <Igra
        key="igra"
        dan={dan}
        naslov={racun.naslov}
        set={racun.set}
        pocetno={igra && prot ? otkrivenoDoSad(igra, prot) : []}
        protivnik={prot ? { ime: prot.ime, zupanija: prot.zupanija, bot: prot.bot } : null}
        zupanija={igra?.zupanija || igrac?.zupanija || ""}
        nadimak={igra?.nadimak || igrac?.nadimak || ""}
        duplaIskoristena={!!igra && igra.dupla !== null}
      />
    </>
  );
}
