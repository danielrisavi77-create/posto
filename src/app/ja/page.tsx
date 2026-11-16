import type { Metadata } from "next";
import Link from "next/link";
import { Papir, Vrh } from "@/components/Zajednicko";
import { danBroj, danaUSezoni, prviDanSezone, sezona } from "@/lib/dan";
import { igracId } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { knjizica } from "@/lib/statistika";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moja knjižica | Pošto?" };

export default async function Ja() {
  const id = await igracId();
  const igre = id ? await pohrana().sveIgre(id) : [];
  const dan = danBroj();
  const knj = knjizica(igre, dan);
  const uSezoni = igre.filter((g) => g.sezona === sezona());
  const poDanu = new Map(uSezoni.map((g) => [g.dan, g.ukupno]));
  const prvi = prviDanSezone();
  const pretinci = Array.from({ length: danaUSezoni() }, (_, k) => ({ redni: k + 1, ukupno: poDanu.get(prvi + k) }));

  if (!igre.length) {
    return (
      <>
        <Vrh />
        <section className="na-stolu">
          <h1 className="naslov">Knjižica je prazna</h1>
          <p className="prica">Ovdje se zbrajaju tvoji računi: niz, prosjek i najbolji rezultat. Prvi upis stiže s prvim plaćenim računom.</p>
        </section>
        <Link className="tipka na-stolu-tipka" href="/">
          Odigraj današnji račun
        </Link>
      </>
    );
  }

  return (
    <>
      <Vrh />
      <Papir oznaka="Tvoja knjižica">
        <p className="glava">
          <b>KNJIŽICA KUPCA</b>
        </p>
        <div className="brojke">
          <div>
            <b>{knj.igara}</b>plaćenih računa
          </div>
          <div>
            <b>{knj.niz}</b>
            {knj.niz === 1 ? "dan zaredom" : "dana zaredom"}
          </div>
          <div>
            <b>{knj.prosjek}</b>prosjek bodova
          </div>
          <div>
            <b>{knj.najbolji}</b>najbolji račun
          </div>
          <div>
            <b>{knj.uCent}</b>odgovora uz samu cijenu
          </div>
          <div>
            <b>{knj.najduziNiz}</b>najdulji niz
          </div>
        </div>
        {knj.tip ? <span className="sitno">Najčešće si: {knj.tip}.</span> : null}
      </Papir>

      <section className="na-stolu">
        <h2 className="naslov">Ladica računa</h2>
        <p className="prica">
          U ovoj sezoni skupljeno {uSezoni.length} od {pretinci.length}. Svi skupljeni računi zbrajaju se u{" "}
          <Link className="veza" href="/veliki-racun">
            Veliki račun sezone
          </Link>
          .
        </p>
      </section>
      <div className="ladica" aria-hidden="true">
        {pretinci.map((p) => (
          <span key={p.redni} className={p.ukupno != null ? "ima" : ""}>
            {p.ukupno ?? p.redni}
          </span>
        ))}
      </div>
    </>
  );
}
