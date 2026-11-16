import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Dijeli } from "@/components/Dijeli";
import { Odbrojavanje } from "@/components/Odbrojavanje";
import { Zaglavlje } from "@/components/Zajednicko";
import { EMOJI, eur, kune, osjecaj, post, razred, runda, tipKupca } from "@/lib/bodovanje";
import { danBroj, danaDoKrajaSezone, danaUSezoni, datumTekst, imeSezone, prviDanSezone, sekundiDoPonoci, sezona } from "@/lib/dan";
import { igracId, protivnikIgre } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { racunIgre, setRacuna, type Stavka } from "@/lib/racuni";

export const dynamic = "force-dynamic";

function nekad(a: Stavka): string {
  return a.kn != null ? kune(a.kn) : eur(a.st, a.cijeli);
}

async function adresaStranice(): Promise<string> {
  const iz = process.env.POSTO_SITE_URL;
  if (iz) return iz.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
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
  const [prot, liga, mojeIgre, adresa] = await Promise.all([protivnikIgre(igra), db.ligaSezone(sezona()), db.igreSezone(id, sezona()), adresaStranice()]);

  const razredi = set.map((a, i) => razred(igra.pogodci[i], a.c));
  const o = osjecaj(racun.stavke.map((s) => s.st), racun.stavke.map((s) => s.c), igra.pogodci);
  const tip = tipKupca(o);
  const finTi = igra.pogodci[4] / fin.st - 1;
  const finStv = fin.c / fin.st - 1;

  const runde = set.map((a, i) => runda(igra.pogodci[i], prot.pogodci[i], a.c));
  const ja = runde.filter((x) => x === 1).length;
  const on = runde.filter((x) => x === -1).length;
  const dvoboj = ja > on ? `pobjeda ${ja}:${on}` : ja < on ? `poraz ${ja}:${on}` : `neriješeno ${ja}:${on}`;

  const poredak = [...liga].sort((a, b) => b.prosjek - a.prosjek || b.igara - a.igara);
  const mjesto = Math.max(1, poredak.findIndex((x) => x.zupanija === igra.zupanija) + 1);
  const prikazLige = poredak.map((x, i) => ({ ...x, mj: i + 1 })).filter((x) => x.mj <= 5 || x.zupanija === igra.zupanija);

  const najvise = Math.max(o.ti, o.stvarno, finStv, racun.sluzbena?.p ?? 0, 0.01);
  const stupci: { kl: string; naziv: string; v: number }[] = [
    { kl: "ti", naziv: "Po tebi (ova 4 artikla)", v: o.ti },
    { kl: "st", naziv: "Stvarno (ova 4 artikla)", v: o.stvarno },
    ...(racun.sluzbena ? [{ kl: "sl", naziv: racun.sluzbena.t, v: racun.sluzbena.p }] : []),
    { kl: "pl", naziv: `${fin.rijec ?? fin.ime} od ${fin.god}`, v: finStv },
  ];

  // Ladica: jedan pretinac po danu tekuće sezone.
  const poDanu = new Map(mojeIgre.map((g) => [g.dan, g.ukupno]));
  const prvi = prviDanSezone();
  const pretinci = Array.from({ length: danaUSezoni() }, (_, k) => ({ redni: k + 1, ukupno: poDanu.get(prvi + k) }));

  // Niz: uzastopni dani unatrag od danas (unutar sezone).
  let niz = 0;
  for (let d = dan; poDanu.has(d); d--) niz++;

  const doKraja = danaDoKrajaSezone();
  const tekst =
    `Pošto? br. ${dan}, ${racun.naslov.toLowerCase()}\n` +
    `${razredi.map((r) => EMOJI[r]).join("")} ${igra.ukupno}/500\n` +
    `Po meni je sve skuplje ${post(o.ti).replace("+", "")} nego ${racun.sluzbena ? "2016." : "u kunama"}\n` +
    `Tip kupca: ${tip.ime}\n` +
    `${igra.zupanija}: ${mjesto}. u ligi\n` +
    `Možeš li bolje? Igraj protiv mene:`;

  return (
    <>
      <Zaglavlje dan={dan} datum={datumTekst()} />
      <section className="racun" aria-label="Tvoj račun">
        <h2>POŠTO?</h2>
        <p className="sred">
          {racun.naslov}
          <br />
          Račun br. {dan} / {datumTekst()}
        </p>
        <hr className="crta" />
        <p>
          Kupac: {igra.nadimak || "Anonimni kupac"}
          <br />
          Blagajna: {igra.zupanija}
        </p>
        <hr className="crta" />
        {set.map((a, i) => (
          <div className="stavka" key={a.ime}>
            <span className="naziv">{a.ime}</span>
            <span>
              {EMOJI[razredi[i]]} {igra.bodovi[i]}
            </span>
            <span className="detalj">
              {a.god} {nekad(a)} / ti {eur(igra.pogodci[i], a.cijeli)} / danas {eur(a.c, a.cijeli)}
            </span>
          </div>
        ))}
        <hr className="crta" />
        <div className="ukupno">
          <span>UKUPNO BODOVA</span>
          <span>
            <b>{igra.ukupno}</b> / 500
          </span>
        </div>
        <p>
          Dvoboj: {dvoboj} protiv {prot.bot ? `${prot.ime} (računalo)` : `${prot.ime} (${prot.zupanija})`}
        </p>
        <hr className="crta" />
        <p className="sred">KOLIKO JE POSKUPJELO</p>
        <div className="osjecaj">
          {stupci.map((s) => (
            <div className={"l " + s.kl} key={s.kl}>
              <span>{s.naziv}</span>
              <b>{post(s.v)}</b>
              <span className="stup">
                <i style={{ width: `${Math.max(0, Math.min(100, Math.round((s.v / najvise) * 100)))}%` }} />
              </span>
            </div>
          ))}
        </div>
        <p>
          Košarica: {eur(o.staro)} nekad, {eur(o.novo)} danas, {eur(o.moje)} po tebi.
          <br />
          {fin.rijec ?? fin.ime}: rekao si {post(finTi)}, stvarno {post(finStv)}.
        </p>
        <div className="titula">{tip.ime}</div>
        <p className="sred">{tip.opis}</p>
        <p className="sitno">Četiri artikla nisu statistička košarica. Služe za usporedbu tvog osjećaja i stvarnih cijena, ne kao mjera inflacije.</p>
      </section>

      <Dijeli tekst={tekst} link={`${adresa}/izazov/${igra.kod}`} />

      <section className="kartica">
        <h3 className="naslov-bloka">
          Liga županija <span className="oznaka-demo">{imeSezone()}</span>
        </h3>
        <p className="opis">
          Prosjek bodova po odigranom računu u ovoj sezoni. Do kraja još {doKraja} {doKraja === 1 ? "dan" : "dana"}. Najbolja županija osvaja Zlatnu blagajnu.
        </p>
        <div className="derbi">
          {prikazLige.map((x, k) => (
            <div key={x.zupanija}>
              {k > 0 && x.mj - prikazLige[k - 1].mj > 1 ? <div className="razmak">· · ·</div> : null}
              <div className={"red" + (x.zupanija === igra.zupanija ? " moj" : "")}>
                <span className="mj">{x.mj}.</span>
                <span>
                  {x.zupanija} <small>({x.igara})</small>
                </span>
                <span>{x.prosjek}</span>
                <span className="traka">
                  <i style={{ width: `${Math.round(x.prosjek / 5)}%` }} />
                </span>
              </div>
            </div>
          ))}
        </div>
        {poredak.length < 2 ? <p className="opis">Tvoja županija je zasad sama u ligi. Pošalji izazov nekome iz druge.</p> : null}
      </section>

      <section className="kartica">
        <h3 className="naslov-bloka">
          Ladica računa{" "}
          <span className="oznaka-demo">
            {mojeIgre.length} / {pretinci.length}
          </span>
        </h3>
        <p className="opis">Svaki dan jedan pronađeni račun. Skupi sve u sezoni i otključaj Veliki račun: cijelo desetljeće na jednom papiru.</p>
        <div className="ladica">
          {pretinci.map((p) => (
            <span key={p.redni} className={p.ukupno != null ? "ima" : ""}>
              {p.ukupno ?? p.redni}
            </span>
          ))}
        </div>
      </section>

      <section className="kartica odbrojavanje">
        <p className="opis">Novi račun stiže za</p>
        <Odbrojavanje sekundi={sekundiDoPonoci()} />
        <p className="niz">
          Tvoj niz: {niz} {niz === 1 ? "dan" : "dana"} zaredom
        </p>
      </section>
    </>
  );
}
