import type { Metadata } from "next";
import Link from "next/link";
import { Papir, Vrh } from "@/components/Zajednicko";
import { eur, post } from "@/lib/bodovanje";
import { danaUSezoni, imeSezone, prviDanSezone, sezona } from "@/lib/dan";
import { igracId } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { velikiRacun } from "@/lib/statistika";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Veliki račun | Pošto?" };

export default async function VelikiRacun() {
  const id = await igracId();
  const igre = id ? await pohrana().sveIgre(id) : [];
  const v = velikiRacun(igre, sezona());
  const ukupnoDana = danaUSezoni();
  const prvi = prviDanSezone();
  const potpun = v.redovi.length >= ukupnoDana;

  return (
    <>
      <Vrh />
      <section className="na-stolu">
        <h1 className="naslov">Veliki račun sezone</h1>
        <p className="prica">Sve košarice koje si ovaj mjesec platio, zbrojene na jednom papiru: koliko je sve skupa koštalo nekad, koliko košta danas, a koliko si ti mislio.</p>
      </section>

      {!v.redovi.length ? (
        <>
          <p className="na-stolu">U ovoj sezoni još nemaš nijedan plaćeni račun.</p>
          <Link className="tipka na-stolu-tipka" href="/">
            Odigraj današnji račun
          </Link>
        </>
      ) : (
        <Papir oznaka="Veliki račun">
          <p className="glava">
            <b>VELIKI RAČUN</b>
            sezona {imeSezone()}
            <br />
            skupljeno {v.redovi.length} od {ukupnoDana}
          </p>
          <hr className="crta" />
          {v.redovi.map((r) => (
            <div className="stavka" key={r.dan}>
              <div className="red">
                <span>
                  {r.dan - prvi + 1}. {r.naslov}
                </span>
                <span>+{r.ukupno}</span>
              </div>
              <span className="sitno">
                nekad {eur(r.staro)}, ti {eur(r.moje)}, danas {eur(r.novo)}
              </span>
            </div>
          ))}
          <hr className="crta" />
          <div className="red">
            <span>Sve skupa nekad</span>
            <span>{eur(v.staro)}</span>
          </div>
          <div className="red">
            <span>Po tebi danas</span>
            <span>{eur(v.moje)}</span>
          </div>
          <div className="red ukupno">
            <span>STVARNO DANAS</span>
            <span>{eur(v.novo)}</span>
          </div>
          <hr className="crta" />
          <div className="stupci">
            <div className="stupac ti">
              <div className="red">
                <span>Tvoj osjećaj poskupljenja</span>
                <b>{post(v.ti)}</b>
              </div>
              <div className="traka" style={{ width: `${Math.max(2, Math.min(100, Math.round((v.ti / Math.max(v.ti, v.stvarno, 0.01)) * 100)))}%` }} />
            </div>
            <div className="stupac st">
              <div className="red">
                <span>Stvarno poskupljenje tih košarica</span>
                <b>{post(v.stvarno)}</b>
              </div>
              <div className="traka" style={{ width: `${Math.max(2, Math.min(100, Math.round((v.stvarno / Math.max(v.ti, v.stvarno, 0.01)) * 100)))}%` }} />
            </div>
          </div>
          <div className="red">
            <span>Bodovi u sezoni</span>
            <span>{v.bodovi}</span>
          </div>
          <div className="pecat">
            {potpun ? "Sezona zaključena" : "Račun otvoren"}
            <small>{potpun ? "svi računi skupljeni" : `fali još ${ukupnoDana - v.redovi.length}`}</small>
          </div>
          <span className="sitno">Košarice su iz različitih godina, pa je zbroj ilustracija tvog osjećaja za cijene, a ne mjera inflacije.</span>
        </Papir>
      )}
    </>
  );
}
