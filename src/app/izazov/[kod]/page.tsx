import type { Metadata } from "next";
import Link from "next/link";
import { Igra } from "@/components/Igra";
import { StariRacun, Vrh } from "@/components/Zajednicko";
import { danBroj } from "@/lib/dan";
import { igracId, otkrivenoDoSad, protivnikIgre, sazetakIzazova } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { javniRacun, racunZaDan } from "@/lib/racuni";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ kod: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  const s = await sazetakIzazova(kod);
  if (!s) return { title: "Pošto?", robots: { index: false } };
  const opis = `${s.ime} (${s.zupanija}) kaže: ${s.mamac}. Ima ${s.ukupno}/500. A ti?`;
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

  const dan = danBroj();
  const db = pohrana();
  const id = await igracId();
  const [mojaIgra, igrac] = await Promise.all([id ? db.igraZaDan(id, dan) : null, id ? db.igrac(id) : null]);
  const racun = racunZaDan(dan);
  const vrijedi = s.danasnji && s.racun === racun.id;
  const javni = javniRacun(racun);

  // Dvoboj počinje odmah: prva stavka je na ovoj stranici, bez obrasca i bez međukoraka.
  // Stranica se osvježi nakon prvog odgovora, pa isti raspored vrijedi i za igru u tijeku.
  if (vrijedi && (!mojaIgra || !mojaIgra.gotovo)) {
    const prot = mojaIgra ? await protivnikIgre(mojaIgra) : null;
    return (
      <>
        <header className="vrh">
          <span className="znak">Pošto?</span>
        </header>
        <div className="izazov-traka" role="status">
          <b>
            {s.ime} ({s.zupanija}) te izaziva
          </b>
          Ima {s.ukupno} od 500 bodova i kaže: {s.mamac}. Tko je bliže cijeni, uzima rundu.
        </div>
        <StariRacun racun={javni} />
        <Igra
          key="igra"
          dan={dan}
          naslov={javni.naslov}
          set={javni.set}
          pocetno={mojaIgra && prot ? otkrivenoDoSad(mojaIgra, prot) : []}
          protivnik={prot ? { ime: prot.ime, zupanija: prot.zupanija, bot: prot.bot } : null}
          zupanija={mojaIgra?.zupanija || igrac?.zupanija || ""}
          nadimak={mojaIgra?.nadimak || igrac?.nadimak || ""}
          duplaIskoristena={!!mojaIgra && mojaIgra.dupla !== null}
          izazov={kod}
          izazivac={s.ime}
        />
      </>
    );
  }

  return (
    <>
      <Vrh />
      <section className="na-stolu">
        <h1 className="naslov">{s.ime} te izaziva</h1>
        <p className="prica">
          {s.ime} ({s.zupanija}) ima {s.ukupno} od 500 bodova na računu "{s.naslov}".
        </p>
      </section>
      {mojaIgra ? (
        <>
          <p className="na-stolu">{vrijedi ? "Današnji račun si već otvorio, pa ovaj dvoboj ne vrijedi. Uzvrati svojim linkom." : "Taj račun je od ranijeg dana, pa dvoboj više ne vrijedi."}</p>
          <Link className="tipka na-stolu-tipka" href={mojaIgra.gotovo ? "/racun" : "/"}>
            {mojaIgra.gotovo ? "Pogledaj svoj račun" : "Nastavi svoj račun"}
          </Link>
        </>
      ) : (
        <>
          <p className="na-stolu">Taj račun je od ranijeg dana, pa dvoboj više ne vrijedi. Današnji račun te čeka.</p>
          <Link className="tipka na-stolu-tipka" href="/">
            Igraj današnji račun
          </Link>
        </>
      )}
    </>
  );
}
