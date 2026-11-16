import { cookies } from "next/headers";
import Link from "next/link";
import { Igra } from "@/components/Igra";
import { PocetnaForma } from "@/components/PocetnaForma";
import { Papir, StariRacun, Vrh } from "@/components/Zajednicko";
import { danBroj } from "@/lib/dan";
import { KOD, KOLACIC_IZAZOV, igracId, otkrivenoDoSad, protivnikIgre } from "@/lib/igra";
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

  // Igra je u tijeku: nastavi gdje je igrač stao.
  if (igra && !igra.gotovo) {
    const prot = await protivnikIgre(igra);
    return (
      <>
        <Vrh />
        <Igra dan={dan} naslov={racun.naslov} set={racun.set} pocetno={otkrivenoDoSad(igra, prot)} protivnik={{ ime: prot.ime, zupanija: prot.zupanija, bot: prot.bot }} />
      </>
    );
  }

  const igrac = id ? await db.igrac(id) : null;

  // Izazov preko linka: prikaži tko izaziva, ali ne i njegove pogotke.
  let izazov: { ime: string; zupanija: string; vrijedi: boolean } | null = null;
  const kod = (await cookies()).get(KOLACIC_IZAZOV)?.value;
  if (kod && KOD.test(kod)) {
    const iz = await db.igraPoKodu(kod);
    if (iz && iz.gotovo && iz.igracId !== id) izazov = { ime: iz.nadimak || "Anonimni kupac", zupanija: iz.zupanija, vrijedi: iz.dan === dan && iz.racun === racun.id };
  }

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

      {izazov ? (
        <div className="izazov-traka" role="status">
          <b>
            Izaziva te {izazov.ime} ({izazov.zupanija})
          </b>
          {igra?.gotovo
            ? "Današnji račun si već platio, pa ovaj dvoboj ne vrijedi. Uzvrati svojim linkom."
            : izazov.vrijedi
              ? "Igrate isti račun. Tko je bliže cijeni, uzima rundu."
              : "Taj izazov je od ranijeg dana, ali današnji račun te čeka."}
        </div>
      ) : null}

      <StariRacun racun={racun} />

      {igra?.gotovo ? (
        <>
          <Link className="tipka na-stolu-tipka" href="/racun">
            Pogledaj današnji račun
          </Link>
          <p className="napomena na-stolu">Ovaj račun si već platio. Novi stiže u ponoć.</p>
        </>
      ) : (
        <Papir oznaka="Podaci o kupcu">
          <PocetnaForma zupanija={igrac?.zupanija ?? ""} nadimak={igrac?.nadimak ?? ""} />
          <p className="sitno">Jedan račun dnevno, bez prijave. Igraš dvoboj protiv kupca iz druge županije.</p>
        </Papir>
      )}
    </>
  );
}
