import Link from "next/link";
import { redirect } from "next/navigation";
import { Dijeli } from "@/components/Dijeli";
import { Odbrojavanje } from "@/components/Odbrojavanje";
import { Tablice } from "@/components/Tablice";
import { Papir, Vrh } from "@/components/Zajednicko";
import { adresaStranice } from "@/lib/adresa";
import { EMOJI, eur, kune, osjecaj, post, razred, runda, tipKupca } from "@/lib/bodovanje";
import { danBroj, danaDoKrajaSezone, danaUSezoni, datumTekst, imeSezone, prviDanSezone, sekundiDoPonoci, sezona } from "@/lib/dan";
import { igracId, protivnikIgre } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { racunIgre, setRacuna, type Stavka } from "@/lib/racuni";
import { knjizica } from "@/lib/statistika";
import { mjestoZupanije, redoviZupanija } from "@/lib/tablice";

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
  const [prot, liga, sveIgre, adresa, mjesto] = await Promise.all([
    protivnikIgre(igra), db.ligaSezone(sezona()), db.sveIgre(id), adresaStranice(), db.mjestoDana(dan, igra.ukupno),
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

  const mjestoZup = mjestoZupanije(liga, igra.zupanija);
  const najvise = Math.max(o.ti, o.stvarno, finStv, racun.sluzbena?.p ?? 0, 0.01);
  const stupci: { kl: string; naziv: string; v: number }[] = [
    { kl: "ti", naziv: "Po tebi (ove 4 stavke)", v: o.ti },
    { kl: "st", naziv: "Stvarno (ove 4 stavke)", v: o.stvarno },
    ...(racun.sluzbena ? [{ kl: "sl", naziv: racun.sluzbena.t, v: racun.sluzbena.p }] : []),
    { kl: "pl", naziv: `${fin.rijec ?? fin.ime} od ${fin.god}`, v: finStv },
  ];

  // Ladica: jedan pretinac po danu tekuće sezone.
  const uSezoni = sveIgre.filter((g) => g.sezona === sezona());
  const poDanu = new Map(uSezoni.map((g) => [g.dan, g.ukupno]));
  const prvi = prviDanSezone();
  const pretinci = Array.from({ length: danaUSezoni() }, (_, k) => ({ redni: k + 1, ukupno: poDanu.get(prvi + k) }));
  const knj = knjizica(sveIgre, dan);
  const doKraja = danaDoKrajaSezone();

  const godina = /\d{4}/.exec(racun.god)?.[0];
  const tekst =
    `Pošto? br. ${dan}, ${racun.naslov.toLowerCase()}\n` +
    `${razredi.map((r) => EMOJI[r]).join("")} ${igra.ukupno}/500\n` +
    `Po meni je sve skuplje ${post(o.ti).replace("+", "")} nego ${godina ? `${godina}.` : "u kunama"}\n` +
    `Tip kupca: ${tip.ime}\n` +
    `${igra.zupanija}: ${mjestoZup}. u ligi županija\n` +
    `Možeš li bolje? Igraj protiv mene:`;

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
              <span>+{igra.bodovi[i]}</span>
            </div>
            <span className="sitno">
              {a.god} {nekad(a)}, ti {eur(igra.pogodci[i], a.cijeli)}, danas {eur(a.c, a.cijeli)}
            </span>
          </div>
        ))}
        <hr className="crta" />
        <div className="red ukupno">
          <span>UKUPNO BODOVA</span>
          <span>{igra.ukupno} / 500</span>
        </div>
        <div className="red">
          <span>Danas si</span>
          <span>
            {mjesto.mjesto}. od {mjesto.igraca}
          </span>
        </div>
        <div className="red">
          <span>Dvoboj</span>
          <span>{dvoboj}</span>
        </div>
        <span className="sitno">protiv: {prot.bot ? `${prot.ime} (računalo)` : `${prot.ime}, ${prot.zupanija}`}</span>
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

      <Dijeli naslov="Izazovi ekipu" tekst={tekst} link={`${adresa}/izazov/${igra.kod}`} napomena="Tko otvori tvoj link, igra dvoboj baš protiv tebe." />

      <Tablice
        naslov="Liga županija"
        kartice={[
          {
            id: "zupanije", naziv: "Županije", stupac: "Županija (broj računa)", vrijednost: "Prosjek",
            redovi: redoviZupanija(liga, igra.zupanija, 5),
            prazno: "Tvoja županija je zasad sama u ligi.",
            opis: `Sezona ${imeSezone()}: još ${doKraja} ${doKraja === 1 ? "dan" : "dana"} do Zlatne blagajne.`,
          },
        ]}
      />
      <p className="na-stolu">
        <Link className="veza" href="/ljestvica">
          Sve ljestvice
        </Link>{" "}
        ili{" "}
        <Link className="veza" href="/liga">
          osnuj ligu za svoju ekipu
        </Link>
        .
      </p>

      <section className="na-stolu">
        <h2 className="naslov">Ladica računa</h2>
        <p className="prica">
          Skupljeno {uSezoni.length} od {pretinci.length}. Svi skupljeni računi zbrajaju se u{" "}
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
            <b>{knj.uCent}</b>cijena pogođenih u cent
          </div>
          <div>
            <b>{knj.najduziNiz}</b>najdulji niz
          </div>
        </div>
        {knj.tip ? <span className="sitno">Najčešće si: {knj.tip}.</span> : null}
        <hr className="crta" />
        <div className="odbrojavanje">
          <span className="sitno">Novi račun stiže za</span>
          <Odbrojavanje sekundi={sekundiDoPonoci()} />
        </div>
      </Papir>
    </>
  );
}
