"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { pogodi } from "@/app/akcije";
import { PECAT, dosjetka, eur, kune, post, zaokruzi } from "@/lib/bodovanje";
import type { Otkrivanje } from "@/lib/igra";
import type { JavnaStavka } from "@/lib/racuni";
import { sviraj } from "./zvuk";

type Props = {
  dan: number;
  naslov: string;
  set: JavnaStavka[];
  /** runde koje su već odigrane (refresh usred igre nastavlja gdje je stao) */
  pocetno: Otkrivanje[];
  protivnik: { ime: string; zupanija: string; bot: boolean };
};

function nekad(a: JavnaStavka): string {
  return a.kn != null ? kune(a.kn) : eur(a.st, a.cijeli);
}

export function Igra({ dan, naslov, set, pocetno, protivnik }: Props) {
  const router = useRouter();
  const zadnja = set.length - 1;
  const [otkriveno, setOtkriveno] = useState<Otkrivanje[]>(pocetno);
  // Nakon refresha ne prikazujemo ponovno zadnje otkrivanje, nego sljedeće pitanje.
  const [prikazOtkrivanja, setPrikazOtkrivanja] = useState(false);
  const [i, setI] = useState(Math.min(pocetno.length, zadnja));
  const [pogodak, setPogodak] = useState(set[Math.min(pocetno.length, zadnja)].st);
  const [greska, setGreska] = useState<string | null>(null);
  const [ceka, startTransition] = useTransition();
  const sidro = useRef<HTMLDivElement>(null);

  // Sve runde su odigrane, a igrač se vratio na početnu: vodi ga na račun.
  useEffect(() => {
    if (pocetno.length >= set.length) router.replace("/racun");
  }, [pocetno.length, set.length, router]);

  useEffect(() => {
    sidro.current?.scrollIntoView({ block: "nearest" });
  }, [i, prikazOtkrivanja]);

  const a = set[i];
  const ja = otkriveno.filter((o) => o.ishod === 1).length;
  const on = otkriveno.filter((o) => o.ishod === -1).length;
  const o = prikazOtkrivanja ? otkriveno[i] : undefined;

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
        sviraj(r.otkrivanje.razred === "g" || r.otkrivanje.razred === "y" ? "kasa" : r.otkrivanje.razred === "r" ? "promasaj" : "pisac");
      } catch {
        setGreska("Veza je pukla. Provjeri internet pa pokušaj ponovno.");
      }
    });
  }

  function dalje() {
    if (i >= zadnja) {
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

  const skok = o ? o.prava / a.st - 1 : 0;
  const isto = Math.abs(skok) < 0.005;
  const rast = pogodak / a.st - 1;
  const rundaTekst = !o ? "" : o.ishod === 1 ? "Runda tebi." : o.ishod === -1 ? (protivnik.bot ? "Runda Ruži." : "Runda njemu.") : "Neriješeno.";

  return (
    <>
      <div className="list">
        <section className="papir" aria-label="Današnji račun">
          <p className="glava">
            <b>POŠTO?</b>
            {naslov}
            <br />
            Račun br. {dan}
          </p>
          <hr className="crta" />
          <div className="dvoboj" aria-label="Dvoboj">
            <span>Ti</span>
            <b>
              {ja} : {on}
            </b>
            <span>{protivnik.bot ? `${protivnik.ime} (računalo)` : `${protivnik.ime}, ${protivnik.zupanija}`}</span>
          </div>
          <hr className="crta" />

          {otkriveno.slice(0, i).map((p, j) => (
            <div className="proslo" key={set[j].ime}>
              <div className="red">
                <span>{set[j].ime}</span>
                <span>+{p.bodovi}</span>
              </div>
              <div className="trag">
                <span>{nekad(set[j])}</span>
                <span className={"ruka" + (p.razred === "g" ? "" : " krizano")}>{eur(p.moj, set[j].cijeli)}</span>
                <span className="ruka crv">{eur(p.prava, set[j].cijeli)}</span>
              </div>
            </div>
          ))}
          {i > 0 ? <hr className="crta" /> : null}

          <div ref={sidro} />
          <span className="kat">
            {i < zadnja ? `Stavka ${i + 1} od ${zadnja}` : "Poleđina računa"}, {a.kat.toLowerCase()}
          </span>
          <h2 className="artikl">{a.ime}</h2>
          <p className="sitno">{a.opis}</p>
          <div className="red">
            <span>Cijena {a.god}</span>
            <span>
              {nekad(a)}
              {a.kn != null ? ` (${eur(a.st)})` : ""}
            </span>
          </div>

          {o ? (
            <>
              <div className="ispravak">
                <span className={"ruka mala" + (o.razred === "g" ? "" : " krizano")}>{eur(o.moj, a.cijeli)}</span>
                <span className="ruka crv zaokruzeno ispis">{eur(o.prava, a.cijeli)}</span>
                <span className={"naljepnica lupi" + (isto ? " isto" : "")}>{isto ? "ista cijena" : post(skok)}</span>
              </div>
              <p className="ruka crv komentar">{dosjetka(o.razred, o.moj, o.prava, dan + i)}</p>
              <p className="ruka olo suparnik">
                {protivnik.ime}: {eur(o.njegov, a.cijeli)}. {rundaTekst}
              </p>
              <div className="bodovi">
                <span>{PECAT[o.razred]}</span>
                <span>+{o.bodovi} / 100</span>
              </div>
              <p className="sitno">
                {a.procjena ? "Današnja cijena je procjena za rujan 2026.: službeni prosjek uvećan za rast cijena te skupine proizvoda. " : ""}
                Izvor:{" "}
                <a href={o.izvor.u} target="_blank" rel="noopener noreferrer">
                  {o.izvor.n}
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="upis">
                <span className="sitno">{a.procjena ? "Danas (procjena)" : "Danas"}</span>
                <span className="ruka" aria-live="off">
                  {eur(pogodak, a.cijeli)}
                </span>
              </div>
              <p className="rast">{Math.abs(rast) < 0.005 ? `isto kao ${a.god}` : `${post(rast)} u odnosu na ${a.god}`}</p>
            </>
          )}
        </section>
      </div>

      {o ? (
        <button className="tipka na-stolu-tipka" onClick={dalje}>
          {i === zadnja ? "Izdaj račun" : i === zadnja - 1 ? "Okreni račun" : "Sljedeća stavka"}
        </button>
      ) : (
        <div className="alat">
          <div className="klizac">
            <label htmlFor="klizac">Povuci na današnju cijenu</label>
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
            <p className="greska na-stolu" role="alert">
              {greska}
            </p>
          ) : null}
          <button className="tipka na-stolu-tipka" onClick={zakljucaj} disabled={ceka}>
            {ceka ? "Provjeravam" : "Zaključaj cijenu"}
          </button>
          {protivnik.bot && i === 0 ? <p className="napomena na-stolu">Danas si među prvima, pa igraš protiv računala. Čim netko iz druge županije završi račun, dvoboji su stvarni.</p> : null}
        </div>
      )}
    </>
  );
}
