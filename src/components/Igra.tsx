"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { pogodi } from "@/app/akcije";
import { PECAT, dosjetka, eur, kune, post, zaokruzi } from "@/lib/bodovanje";
import type { Otkrivanje } from "@/lib/igra";
import type { JavnaStavka } from "@/lib/racuni";

type Props = {
  dan: number;
  set: JavnaStavka[];
  /** runde koje su već odigrane (refresh usred igre nastavlja gdje je stao) */
  pocetno: Otkrivanje[];
  mojaZupanija: string;
  protivnik: { ime: string; zupanija: string; bot: boolean };
};

function nekad(a: JavnaStavka): string {
  return a.kn != null ? kune(a.kn) : eur(a.st, a.cijeli);
}

export function Igra({ dan, set, pocetno, mojaZupanija, protivnik }: Props) {
  const router = useRouter();
  const [otkriveno, setOtkriveno] = useState<Otkrivanje[]>(pocetno);
  // Nakon refresha ne prikazujemo ponovno zadnje otkrivanje, nego sljedeće pitanje.
  const [prikazOtkrivanja, setPrikazOtkrivanja] = useState(false);
  const [i, setI] = useState(Math.min(pocetno.length, set.length - 1));
  const [pogodak, setPogodak] = useState(set[Math.min(pocetno.length, set.length - 1)].st);
  const [greska, setGreska] = useState<string | null>(null);
  const [ceka, startTransition] = useTransition();
  const vrh = useRef<HTMLDivElement>(null);

  // Sve runde su odigrane, a igrač se vratio na početnu: vodi ga na račun.
  useEffect(() => {
    if (pocetno.length >= set.length) router.replace("/racun");
  }, [pocetno.length, set.length, router]);

  useEffect(() => {
    vrh.current?.scrollIntoView({ block: "start" });
  }, [i, prikazOtkrivanja]);

  const a = set[i];
  const ja = otkriveno.filter((o) => o.ishod === 1).length;
  const on = otkriveno.filter((o) => o.ishod === -1).length;

  function zakljucaj() {
    if (ceka) return;
    setGreska(null);
    startTransition(async () => {
      try {
        const r = await pogodi(i, pogodak);
        if ("greska" in r) {
          setGreska(r.greska);
          return;
        }
        setOtkriveno((stari) => (stari.length > i ? stari : [...stari, r.otkrivanje]));
        setPrikazOtkrivanja(true);
      } catch {
        setGreska("Veza je pukla. Provjeri internet i pokušaj ponovno.");
      }
    });
  }

  function dalje() {
    if (i >= set.length - 1) {
      router.push("/racun");
      return;
    }
    setI(i + 1);
    setPogodak(set[i + 1].st);
    setPrikazOtkrivanja(false);
  }

  function pomak(smjer: number) {
    setPogodak((p) => zaokruzi(Math.max(0, Math.min(a.max, p + smjer * a.f))));
  }

  const napredak = (
    <div className="napredak" aria-label="Napredak">
      {set.map((s, j) => (
        <span key={s.ime} className={j < otkriveno.length ? otkriveno[j].razred : j === i ? "sad" : ""} />
      ))}
    </div>
  );
  const semafor = (
    <div className="dvoboj">
      <span>Ti ({mojaZupanija})</span>
      <b>
        {ja} : {on}
      </b>
      <span>
        {protivnik.ime} ({protivnik.zupanija})
      </span>
    </div>
  );

  const o = prikazOtkrivanja ? otkriveno[i] : undefined;

  if (o) {
    const skok = o.prava / a.st - 1;
    const isto = Math.abs(skok) < 0.005;
    const rundaTekst = o.ishod === 1 ? "Runda tebi." : o.ishod === -1 ? (protivnik.bot ? "Runda ide Ruži." : `Runda ide u ${protivnik.zupanija}.`) : "Neriješeno.";
    return (
      <>
        <div ref={vrh} />
        {napredak}
        {semafor}
        <section className="kartica">
          <span className="kategorija">{a.kat}</span>
          <h2 className="artikl">{a.ime}</h2>
          <div className="usporedba">
            <div className="n">
              <span>{a.god}</span>
              <b>{nekad(a)}</b>
            </div>
            <div>
              <span>Ti kažeš</span>
              <b>{eur(o.moj, a.cijeli)}</b>
            </div>
            <div className="prava">
              <span>Danas</span>
              <b>{eur(o.prava, a.cijeli)}</b>
            </div>
          </div>
          <div className={"skok" + (isto ? " nula" : "")}>{isto ? `Ista cijena od ${a.god}` : `${post(skok)} od ${a.god}`}</div>
          <div className="ocjena">
            <span className={"pecat " + o.razred}>{PECAT[o.razred]}</span>
            <span className="bodovi">+{o.bodovi} / 100</span>
          </div>
          <p className="dosjetka">{dosjetka(o.razred, o.moj, o.prava, dan + i)}</p>
          <p className="protivnik">
            {protivnik.ime} kaže {eur(o.njegov, a.cijeli)}. {rundaTekst}
          </p>
          <p className="izvor">
            {a.opis}. Izvor:{" "}
            <a href={o.izvor.u} target="_blank" rel="noopener noreferrer">
              {o.izvor.n}
            </a>
          </p>
          <button className="gumb" onClick={dalje}>
            {i === set.length - 1 ? "Izdaj račun" : i === set.length - 2 ? "Okreni račun" : "Sljedeća cijena"}
          </button>
        </section>
      </>
    );
  }

  const rast = pogodak / a.st - 1;
  return (
    <>
      <div ref={vrh} />
      {napredak}
      {semafor}
      {protivnik.bot ? <p className="bot">Danas si među prvima, pa igraš protiv računala. Čim netko iz druge županije završi račun, dvoboji su stvarni.</p> : null}
      <section className="kartica">
        <span className="kategorija">{a.kat}</span>
        <h2 className="artikl">{a.ime}</h2>
        <p className="opis">{a.opis}</p>
        <div className="nekad">
          <span>Cijena {a.god}</span>
          <b>
            {nekad(a)}
            {a.kn != null ? <small> ({eur(a.st)})</small> : null}
          </b>
        </div>
        <div className="cijena">{eur(pogodak, a.cijeli)}</div>
        <div className="rast">{Math.abs(rast) < 0.005 ? `isto kao ${a.god}` : `${post(rast)} u odnosu na ${a.god}`}</div>
        <div className="klizac">
          <label htmlFor="klizac" className="opis">
            Povuci na današnju cijenu
          </label>
          <input
            type="range"
            id="klizac"
            min={0}
            max={a.max}
            step={a.k}
            value={pogodak}
            onChange={(e) => setPogodak(zaokruzi(parseFloat(e.target.value)))}
            disabled={ceka}
          />
          <div className="raspon">
            <span>{eur(0, a.cijeli)}</span>
            <span>{eur(a.max, a.cijeli)}</span>
          </div>
          <div className="fino">
            <button type="button" onClick={() => pomak(-1)} disabled={ceka} aria-label={`Smanji za ${eur(a.f, a.cijeli)}`}>
              − {eur(a.f, a.cijeli)}
            </button>
            <button type="button" onClick={() => pomak(1)} disabled={ceka} aria-label={`Povećaj za ${eur(a.f, a.cijeli)}`}>
              + {eur(a.f, a.cijeli)}
            </button>
          </div>
        </div>
        {greska ? (
          <p className="greska" role="alert">
            {greska}
          </p>
        ) : null}
        <button className="gumb" onClick={zakljucaj} disabled={ceka}>
          {ceka ? "Provjeravam" : "Zaključaj cijenu"}
        </button>
      </section>
      <p className="podnozje">{i < set.length - 1 ? `Cijena ${i + 1} od ${set.length - 1}` : "Zadnje pitanje: druga strana računa"}</p>
    </>
  );
}
