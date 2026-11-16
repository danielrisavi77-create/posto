import type { Metadata } from "next";
import Link from "next/link";
import { prihvatiIzazov } from "@/app/akcije";
import { Papir, Vrh } from "@/components/Zajednicko";
import { EMOJI } from "@/lib/bodovanje";
import { sazetakIzazova } from "@/lib/igra";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ kod: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const s = await sazetakIzazova(kod);
  if (!s) return { title: "Pošto?", robots: { index: false } };
  const opis = `${s.ime} (${s.zupanija}) ima ${s.ukupno}/500 na računu "${s.naslov}". Možeš li bolje?`;
  return {
    title: `${s.ime} te izaziva na Pošto?`,
    description: opis,
    robots: { index: false },
    openGraph: { title: `${s.ime} te izaziva na Pošto?`, description: opis, locale: "hr_HR", type: "website" },
  };
}

export default async function Izazov({ params }: Props) {
  const { kod } = await params;
  const s = await sazetakIzazova(kod);

  if (!s) {
    return (
      <>
        <Vrh />
        <section className="na-stolu">
          <h1 className="naslov">Ovaj izazov ne postoji</h1>
          <p className="prica">Link je možda krivo kopiran. Današnji račun te svejedno čeka.</p>
        </section>
        <Link className="tipka na-stolu-tipka" href="/">
          Igraj današnji račun
        </Link>
      </>
    );
  }

  return (
    <>
      <Vrh />
      <section className="na-stolu">
        <h1 className="naslov">{s.ime} te izaziva</h1>
        <p className="prica">Stari račun u kunama, a ti pogađaš koliko iste stvari koštaju danas. Tko je bliže cijeni, uzima rundu.</p>
      </section>
      <Papir oznaka="Rezultat izazivača">
        <p className="glava">
          <b>POŠTO?</b>
          {s.naslov}
          <br />
          Račun br. {s.dan}
        </p>
        <hr className="crta" />
        <div className="red">
          <span>Kupac</span>
          <span>{s.ime}</span>
        </div>
        <div className="red">
          <span>Blagajna</span>
          <span>{s.zupanija}</span>
        </div>
        <div className="red">
          <span>Pet odgovora</span>
          <span aria-hidden="true">{s.razredi.map((r) => EMOJI[r]).join("")}</span>
        </div>
        <hr className="crta" />
        <div className="red ukupno">
          <span>UKUPNO BODOVA</span>
          <span>{s.ukupno} / 500</span>
        </div>
      </Papir>
      {s.danasnji ? (
        <form action={prihvatiIzazov} className="sakrij">
          <input type="hidden" name="kod" value={kod} />
          <button className="tipka crvena na-stolu-tipka" type="submit">
            Prihvati izazov
          </button>
        </form>
      ) : (
        <>
          <p className="na-stolu">Taj račun je od ranijeg dana, pa dvoboj više ne vrijedi.</p>
          <Link className="tipka na-stolu-tipka" href="/">
            Igraj današnji račun
          </Link>
        </>
      )}
    </>
  );
}
