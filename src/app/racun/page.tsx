import Link from "next/link";
import { redirect } from "next/navigation";
import { DerbiDana } from "@/components/DerbiDana";
import { Dijeli } from "@/components/Dijeli";
import { Odbrojavanje } from "@/components/Odbrojavanje";
import { Tablice } from "@/components/Tablice";
import { Papir, Vrh } from "@/components/Zajednicko";
import { adresaStranice } from "@/lib/adresa";
import { EMOJI, eur, kune, osjecaj, post, razred, runda, tipKupca } from "@/lib/bodovanje";
import { danBroj, danaDoKrajaSezone, datumTekst, imeSezone, sekundiDoPonoci, sezona } from "@/lib/dan";
import { derbi } from "@/lib/derbi";
import { igracId, mamacIgre, protivnikIgre, usporedba } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { racunIgre, setRacuna, type Stavka } from "@/lib/racuni";
import { redoviZupanija } from "@/lib/tablice";

export const dynamic = "force-dynamic";

function nekad(a: Stavka): string {
  return a.kn != null ? kune(a.kn) : eur(a.st, a.cijeli);
}

export default async function RacunStranica() {
  const id = await igracId();
  if (!id) redirect("/");
  const db = pohrana();
  const dan = danBroj();
  const igra = await db.igraZaDan(id, dan);
  if (!igra || !igra.gotovo) redirect("/");

  const racun = racunIgre(igra);
  const set = setRacuna(racun);
  const fin = racun.finale;
  const [prot, liga, adresa, mjesto, sviDanas, danasDerbi, jucerDerbi, kupci] = await Promise.all([
    protivnikIgre(igra), db.ligaSezone(sezona()), adresaStranice(), db.mjestoDana(dan, igra.ukupno), db.topDana(dan, 1000),
    derbi(dan), dan > 1 ? derbi(dan - 1) : null,
    Promise.all(set.map((a, i) => usporedba(dan, racun.id, i, igra.pogodci[i], a.c, id))),
  ]);

  const razredi = set.map((a, i) => razred(igra.pogodci[i], a.c));
  const o = osjecaj(racun.stavke.map((s) => s.st), racun.stavke.map((s) => s.c), igra.pogodci);
  const tip = tipKupca(o);
  const finTi = igra.pogodci[4] / fin.st - 1;
  const finStv = fin.c / fin.st - 1;
  const imaProcjena = set.some((s) => s.procjena);

  const runde = set.map((a, i) => runda(igra.pogodci[i], prot.pogodci[i], a.c));
  const ja = runde.filter((x) => x === 1).length;
  const on = runde.filter((x) => x === -1).length;
  const dvoboj = ja > on ? `pobjeda ${ja}:${on}` : ja < on ? `poraz ${ja}:${on}` : `neriješeno ${ja}:${on}`;

  // Liga županija i rečenica "tvoja županija treba tebe".
  const poredak = [...liga].sort((a, b) => b.prosjek - a.prosjek || b.igara - a.igara);
  const k = poredak.findIndex((x) => x.zupanija === igra.zupanija);
  const mjestoZup = Math.max(1, k + 1);
  let trebaTe = "";
  if (k > 0) trebaTe = `${igra.zupanija} je ${k + 1}. Do ${k}. mjesta fali ${poredak[k - 1].prosjek - poredak[k].prosjek + 1} bodova prosjeka: svaki dobar račun iz tvoje županije ga diže.`;
  else if (k === 0 && poredak.length > 1) trebaTe = `${igra.zupanija} vodi. Druga je ${poredak[1].zupanija}, ${poredak[0].prosjek - poredak[1].prosjek} bodova iza.`;
  else if (k === 0) trebaTe = `${igra.zupanija} je zasad sama u ligi. Pošalji izazov nekome iz druge županije.`;

  // Raspodjela današnjih rezultata: deset razreda po 60 bodova.
  const razredaka = Array.from({ length: 10 }, () => 0);
  for (const r of sviDanas) razredaka[Math.min(9, Math.floor(r.bodovi / 60))]++;
  const mojRazred = Math.min(9, Math.floor(igra.ukupno / 60));
  const najviseURazredu = Math.max(1, ...razredaka);
  const boljiOd = mjesto.igraca > 1 ? Math.round(((mjesto.igraca - mjesto.mjesto) / (mjesto.igraca - 1)) * 100) : null;

  const najvise = Math.max(o.ti, o.stvarno, finStv, racun.sluzbena?.p ?? 0, 0.01);
  const stupci: { kl: string; naziv: string; v: number }[] = [
    { kl: "ti", naziv: "Po tebi (ove 4 stavke)", v: o.ti },
    { kl: "st", naziv: "Stvarno (ove 4 stavke)", v: o.stvarno },
    ...(racun.sluzbena ? [{ kl: "sl", naziv: racun.sluzbena.t, v: racun.sluzbena.p }] : []),
    { kl: "pl", naziv: `${fin.rijec ?? fin.ime} od ${fin.god}`, v: finStv },
  ];
  const doKraja = danaDoKrajaSezone();

  const tekst =
    `Pošto? br. ${dan}, ${racun.naslov.toLowerCase()}\n` +
    `${razredi.map((r) => EMOJI[r]).join("")} ${igra.ukupno}/500\n` +
    `Kažem da je ${mamacIgre(igra)}. A ti?\n` +
    `Tip kupca: ${tip.ime}\n` +
    `${igra.zupanija}: ${mjestoZup}. u ligi županija\n` +
    `Igraj protiv mene:`;

  return (
    <>
      <Vrh />
      <Papir oznaka="Tvoj račun">
        <p className="glava">
          <b>POŠTO?</b>
          {racun.naslov}
          <br />
          Račun br. {dan}, {datumTekst()}
        </p>
        <hr className="crta" />
        <div className="red">
          <span>Kupac</span>
          <span>{igra.nadimak || "Anonimni kupac"}</span>
        </div>
        <div className="red">
          <span>Blagajna</span>
          <span>{igra.zupanija}</span>
        </div>
        <hr className="crta" />
        {set.map((a, i) => (
          <div className="stavka" key={a.ime}>
            <div className="red">
              <span>{a.ime}</span>
              <span>
                {igra.dupla === i ? "dupla " : ""}+{igra.bodovi[i]}
              </span>
            </div>
            <span className="sitno">
              {a.god} {nekad(a)}, ti {eur(igra.pogodci[i], a.cijeli)}, danas {eur(a.c, a.cijeli)}
              {kupci[i] ? `, kupci ${eur(kupci[i]!.medijan, a.cijeli)} (bliži si od ${kupci[i]!.boljiOd} %)` : ""}
            </span>
          </div>
        ))}
        <hr className="crta" />
        <div className="red ukupno">
          <span>UKUPNO BODOVA</span>
          <span>{igra.ukupno} / 500</span>
        </div>
        <div className="red">
          <span>Dvoboj</span>
          <span>{dvoboj}</span>
        </div>
        <span className="sitno">protiv: {prot.bot ? `${prot.ime} (računalo)` : `${prot.ime}, ${prot.zupanija}`}</span>
        <hr className="crta" />

        <p>TI I OSTALI KUPCI</p>
        <div className="red">
          <span>Danas si</span>
          <span>
            {mjesto.mjesto}. od {mjesto.igraca}
          </span>
        </div>
        {boljiOd !== null ? (
          <>
            <div className="raspodjela" aria-hidden="true">
              {razredaka.map((n, i) => (
                <i key={i} className={i === mojRazred ? "ja" : ""} style={{ height: `${Math.max(6, Math.round((n / najviseURazredu) * 100))}%` }} />
              ))}
            </div>
            <span className="sitno">Raspodjela današnjih rezultata, od 0 do 600 bodova. Plavi stupac je tvoj. Bolji si od {boljiOd} % kupaca.</span>
          </>
        ) : (
          <span className="sitno">Prvi si danas platio račun. Raspodjela rezultata stiže s drugim kupcima.</span>
        )}
        <hr className="crta" />

        <p>KOLIKO JE POSKUPJELO</p>
        <div className="stupci">
          {stupci.map((s) => (
            <div className={"stupac " + s.kl} key={s.kl}>
              <div className="red">
                <span>{s.naziv}</span>
                <b>{post(s.v)}</b>
              </div>
              <div className="traka" style={{ width: `${Math.max(2, Math.min(100, Math.round((s.v / najvise) * 100)))}%` }} />
            </div>
          ))}
        </div>
        <span className="sitno">
          Košarica: {eur(o.staro)} nekad, {eur(o.novo)} danas, {eur(o.moje)} po tebi. {fin.rijec ?? fin.ime}: rekao si {post(finTi)}, stvarno {post(finStv)}.
        </span>

        <div className="pecat">
          <small>tip kupca</small>
          {tip.ime}
        </div>
        <p style={{ textAlign: "center" }}>{tip.opis}</p>
        <span className="sitno">
          Četiri stavke nisu statistička košarica: služe za usporedbu tvog osjećaja i cijena, ne kao mjera inflacije.
          {imaProcjena ? " Današnje cijene na ovom računu su procjene za rujan 2026. (DZS-ov prosjek uvećan za rast cijena skupine prema Eurostatu)." : ""}
        </span>
      </Papir>

      <Dijeli naslov="Izazovi ekipu" tekst={tekst} link={`${adresa}/izazov/${igra.kod}`} slika={`/izazov/${igra.kod}/slika`} napomena="Na slici nema današnjih cijena, pa nikome ne kvariš igru. Tko otvori link, igra dvoboj baš protiv tebe." />

      <DerbiDana danas={danasDerbi} jucer={jucerDerbi} mojaZupanija={igra.zupanija} />

      <Tablice
        naslov="Liga županija"
        kartice={[
          {
            id: "zupanije", naziv: "Županije", stupac: "Županija (broj računa)", vrijednost: "Prosjek",
            redovi: redoviZupanija(liga, igra.zupanija, 5),
            prazno: "Tvoja županija je zasad sama u ligi.",
            opis: `${trebaTe} Sezona ${imeSezone()}: još ${doKraja} ${doKraja === 1 ? "dan" : "dana"} do Zlatne blagajne.`,
          },
        ]}
      />

      <section className="na-stolu" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="napomena">Novi račun stiže za</span>
        <div className="odbrojavanje">
          <Odbrojavanje sekundi={sekundiDoPonoci()} />
        </div>
        <p>
          <Link className="veza" href="/ja">
            Tvoja knjižica
          </Link>
          ,{" "}
          <Link className="veza" href="/ljestvica">
            sve ljestvice
          </Link>{" "}
          i{" "}
          <Link className="veza" href="/liga">
            lige za ekipu
          </Link>
          .
        </p>
      </section>
    </>
  );
}
