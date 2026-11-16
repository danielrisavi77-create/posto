import type { Metadata } from "next";
import Link from "next/link";
import { adresaStranice } from "@/lib/adresa";
import { Dijeli } from "@/components/Dijeli";
import { UdjiULigu } from "@/components/LigaForme";
import { Tablice } from "@/components/Tablice";
import { Papir, Vrh } from "@/components/Zajednicko";
import { imeSezone } from "@/lib/dan";
import { igracId } from "@/lib/igra";
import { KOD_LIGE, tablicaLige } from "@/lib/liga";
import { pohrana } from "@/lib/pohrana";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Liga | Pošto?", robots: { index: false } };

export default async function LigaStranica({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const db = pohrana();
  const liga = KOD_LIGE.test(kod) ? await db.ligaPoKodu(kod) : null;

  if (!liga) {
    return (
      <>
        <Vrh />
        <section className="na-stolu">
          <h1 className="naslov">Ova liga ne postoji</h1>
          <p className="prica">Kod je možda krivo prepisan. Ima šest znakova, mala slova i brojke.</p>
        </section>
        <Link className="tipka na-stolu-tipka" href="/liga">
          Moje lige
        </Link>
      </>
    );
  }

  const id = await igracId();
  const [tablica, adresa] = await Promise.all([tablicaLige(liga), adresaStranice()]);
  const clan = !!id && tablica.some((r) => r.igracId === id);
  const poDanu = [...tablica].filter((r) => r.danas != null).sort((a, b) => (b.danas ?? 0) - (a.danas ?? 0));

  return (
    <>
      <Vrh />
      <section className="na-stolu">
        <h1 className="naslov">{liga.naziv}</h1>
        <p className="prica">
          Privatna liga, {tablica.length} {tablica.length === 1 ? "član" : tablica.length < 5 ? "člana" : "članova"}. Kod za ulazak: <b>{liga.kod}</b>
        </p>
      </section>

      {!clan ? (
        <Papir oznaka="Ulazak u ligu">
          <UdjiULigu kod={liga.kod} />
          <p className="sitno">Ako još nisi igrao, prvo plati današnji račun pa se vrati na ovaj link.</p>
        </Papir>
      ) : null}

      <Tablice
        naslov="Tablica lige"
        kartice={[
          {
            id: "sezona", naziv: "Sezona", stupac: "Kupac", vrijednost: "Bodovi",
            redovi: tablica.map((r, i) => ({ mj: i + 1, ime: r.ime, dodatak: `${r.zupanija}, ${r.igara} ${r.igara === 1 ? "račun" : "računa"}`, vrijednost: String(r.sezona), moj: r.igracId === id })),
            prazno: "Liga još nema članova.",
            opis: `Zbroj bodova u sezoni ${imeSezone()}.`,
          },
          {
            id: "danas", naziv: "Danas", stupac: "Kupac", vrijednost: "Bodovi",
            redovi: poDanu.map((r, i) => ({ mj: i + 1, ime: r.ime, dodatak: r.zupanija, vrijednost: String(r.danas), moj: r.igracId === id })),
            prazno: "Danas još nitko iz lige nije platio račun.",
            opis: "Današnji račun, samo članovi lige.",
          },
        ]}
      />

      {clan ? <Dijeli naslov="Pozovi u ligu" tekst={`Uđi u moju ligu na Pošto?: ${liga.naziv}\nKod: ${liga.kod}`} link={`${adresa}/liga/${liga.kod}`} /> : null}
    </>
  );
}
