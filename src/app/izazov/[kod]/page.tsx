import type { Metadata } from "next";
import Link from "next/link";
import { prihvatiIzazov } from "@/app/akcije";
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
        <div className="logo velik">POŠTO?</div>
        <section className="kartica">
          <h1 className="artikl">Ovaj izazov ne postoji</h1>
          <p className="opis">Link je možda krivo kopiran. Današnji račun te svejedno čeka.</p>
          <Link className="gumb crveni" href="/">
            Igraj današnji račun
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="logo velik">POŠTO?</div>
      <h1 className="slogan">
        {s.ime} te izaziva. <em>Možeš li bolje?</em>
      </h1>
      <section className="kartica">
        <span className="kategorija">{s.zupanija}</span>
        <div className="cijena" aria-label={`Rezultat ${s.ukupno} od 500`}>
          {s.ukupno}
          <small>/500</small>
        </div>
        <p className="rast" aria-hidden="true">
          {s.razredi.map((r) => EMOJI[r]).join(" ")}
        </p>
        <p className="opis">
          Račun br. {s.dan}: {s.naslov}. Stari račun u kunama, a ti pogađaš koliko iste stvari koštaju danas.
        </p>
        {s.danasnji ? (
          <form action={prihvatiIzazov}>
            <input type="hidden" name="kod" value={kod} />
            <button className="gumb crveni" type="submit">
              Prihvati izazov
            </button>
          </form>
        ) : (
          <>
            <p className="niz">Taj račun je od ranijeg dana, pa dvoboj više ne vrijedi.</p>
            <Link className="gumb crveni" href="/">
              Igraj današnji račun
            </Link>
          </>
        )}
      </section>
      <p className="podnozje">Jedan račun dnevno. Bez prijave. Traje oko minute.</p>
    </>
  );
}
