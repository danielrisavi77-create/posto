import { cookies } from "next/headers";
import Link from "next/link";
import { Igra } from "@/components/Igra";
import { PocetnaForma } from "@/components/PocetnaForma";
import { StariRacun, Zaglavlje } from "@/components/Zajednicko";
import { danBroj, datumTekst } from "@/lib/dan";
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
        <Zaglavlje dan={dan} datum={datumTekst()} />
        <Igra
          dan={dan}
          set={racun.set}
          pocetno={otkrivenoDoSad(igra, prot)}
          mojaZupanija={igra.zupanija}
          protivnik={{ ime: prot.ime, zupanija: prot.zupanija, bot: prot.bot }}
        />
      </>
    );
  }

  const igrac = id ? await db.igrac(id) : null;

  // Izazov preko linka: prikaži tko izaziva, ali ne i njegov rezultat po rundama.
  let izazov: { ime: string; zupanija: string; vrijedi: boolean } | null = null;
  const kod = (await cookies()).get(KOLACIC_IZAZOV)?.value;
  if (kod && KOD.test(kod)) {
    const iz = await db.igraPoKodu(kod);
    if (iz && iz.gotovo && iz.igracId !== id) izazov = { ime: iz.nadimak || "Anonimni kupac", zupanija: iz.zupanija, vrijedi: iz.dan === dan };
  }

  return (
    <>
      <div className="logo velik">POŠTO?</div>
      <h1 className="slogan">
        {racun.naslov}. <em>Pošto je to danas?</em>
      </h1>
      <p className="prica">{racun.prica}</p>
      {izazov ? (
        <div className="izazov" role="status">
          <b>
            Izaziva te {izazov.ime} ({izazov.zupanija})
          </b>
          {igra?.gotovo
            ? "Današnji račun si već platio, pa ovaj dvoboj ne vrijedi. Uzvrati izazov svojim linkom."
            : izazov.vrijedi
              ? "Igrate isti račun. Tko je bliže cijeni, uzima rundu."
              : "Taj izazov je od ranijeg dana, ali današnji račun te čeka."}
        </div>
      ) : null}
      <StariRacun racun={racun} />
      {igra?.gotovo ? (
        <section className="kartica">
          <Link className="gumb crveni" href="/racun">
            Pogledaj današnji račun
          </Link>
          <p className="niz">Ovaj račun si već platio. Novi stiže u ponoć.</p>
        </section>
      ) : (
        <PocetnaForma zupanija={igrac?.zupanija ?? ""} nadimak={igrac?.nadimak ?? ""} />
      )}
      <p className="podnozje">Jedan račun dnevno. Bez prijave. Traje oko minute.</p>
    </>
  );
}
