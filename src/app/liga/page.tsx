import type { Metadata } from "next";
import Link from "next/link";
import { OsnujLigu, UdjiULigu } from "@/components/LigaForme";
import { Papir, Vrh } from "@/components/Zajednicko";
import { igracId } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moje lige | Pošto?" };

export default async function MojeLige() {
  const id = await igracId();
  const db = pohrana();
  const igrac = id ? await db.igrac(id) : null;
  const lige = igrac ? await db.ligeIgraca(igrac.id) : [];

  return (
    <>
      <Vrh />
      <section className="na-stolu">
        <h1 className="naslov">Moje lige</h1>
        <p className="prica">Liga je privatna tablica za ekipu, obitelj ili ured. Svi igraju isti dnevni račun, a tablica pamti cijelu sezonu.</p>
      </section>

      {!igrac ? (
        <>
          <p className="na-stolu">Za ligu ti treba barem jedan plaćeni račun, da znamo tko si i za koju županiju igraš.</p>
          <Link className="tipka na-stolu-tipka" href="/igraj">
            Odigraj današnji račun
          </Link>
        </>
      ) : (
        <>
          {lige.length ? (
            <Papir oznaka="Popis liga">
              <p className="glava">
                <b>TVOJE LIGE</b>
              </p>
              {lige.map((l) => (
                <div className="red" key={l.id}>
                  <Link href={`/liga/${l.kod}`}>{l.naziv}</Link>
                  <span>{l.kod}</span>
                </div>
              ))}
            </Papir>
          ) : (
            <p className="na-stolu">Još nisi ni u jednoj ligi. Osnuj svoju ili upiši kod koji ti je netko poslao.</p>
          )}
          <Papir oznaka="Nova liga">
            <OsnujLigu />
          </Papir>
          <Papir oznaka="Ulazak u ligu">
            <UdjiULigu />
          </Papir>
        </>
      )}
    </>
  );
}
