"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { pogodi, upisiKupca } from "@/app/akcije";
import { PECAT, dosjetka, eur, kune, post, zaokruzi } from "@/lib/bodovanje";
import type { JavniProtivnik, Otkrivanje } from "@/lib/igra";
import type { JavnaStavka } from "@/lib/racuni";
import { ZUPANIJE } from "@/lib/zupanije";
import { sviraj } from "./zvuk";

type Props = {
  dan: number;
  naslov: string;
  set: JavnaStavka[];
  /** runde koje su već odigrane (refresh usred igre nastavlja gdje je stao) */
  pocetno: Otkrivanje[];
  /** null dok račun nije otvoren: protivnik se dodjeljuje s prvim odgovorom */
  protivnik: JavniProtivnik | null;
  /** prazno ako igrač još nije odabrao županiju */
  zupanija: string;
  nadimak: string;
  duplaIskoristena: boolean;
  /** kod izazova: prvi odgovor otvara dvoboj protiv izazivača */
  izazov?: string;
  izazivac?: string;
};

function nekad(a: JavnaStavka): string {
  return a.kn != null ? kune(a.kn) : eur(a.st, a.cijeli);
}

const STANKA_MS = 750;

export function Igra(p: Props) {
  const { dan, naslov, set } = p;
  const router = useRouter();
  const zadnja = set.length - 1;
  const pocetniIndeks = Math.min(p.pocetno.length, zadnja);

  const [otkriveno, setOtkriveno] = useState<Otkrivanje[]>(p.pocetno);
  // Nakon refresha ne prikazujemo ponovno zadnje otkrivanje, nego sljedeće pitanje.
  const [faza, setFaza] = useState<"pitanje" | "stanka" | "otkriveno">("pitanje");
  const [i, setI] = useState(pocetniIndeks);
  const [pogodak, setPogodak] = useState(set[pocetniIndeks].st);
  const [dupla, setDupla] = useState(false);
  const [duplaIskoristena, setDuplaIskoristena] = useState(p.duplaIskoristena);
  const [prot, setProt] = useState<JavniProtivnik | null>(p.protivnik);
  const [zupanija, setZupanija] = useState(p.zupanija);
  const [nadimak, setNadimak] = useState(p.nadimak);
  const [trebaZupaniju, setTrebaZupaniju] = useState(p.pocetno.length > 0 && !p.zupanija);
  const [greska, setGreska] = useState<string | null>(null);
  const [ceka, startTransition] = useTransition();
  const sidro = useRef<HTMLDivElement>(null);
  const stanka = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sve runde su odigrane, a igrač se vratio na početnu: vodi ga na račun.
  useEffect(() => {
    if (p.pocetno.length >= set.length) router.replace("/racun");
  }, [p.pocetno.length, set.length, router]);

  useEffect(() => {
    if (faza !== "pitanje" || i > 0) sidro.current?.scrollIntoView({ block: "nearest" });
  }, [i, faza]);

  useEffect(() => () => { if (stanka.current) clearTimeout(stanka.current); }, []);

  const a = set[i];
  const ja = otkriveno.filter((o) => o.ishod === 1).length;
  const on = otkriveno.filter((o) => o.ishod === -1).length;
  const o = faza === "otkriveno" ? otkriveno[i] : undefined;
  const suparnik = prot?.ime ?? p.izazivac ?? null;

  function zakljucaj() {
    if (ceka || faza !== "pitanje") return;
    setGreska(null);
    startTransition(async () => {
      try {
        const r = await pogodi(i, pogodak, dupla, i === 0 ? p.izazov : undefined);
        if ("greska" in r) {
          setGreska(r.greska);
          return;
        }
        setOtkriveno((stari) => (stari.length > i ? stari : [...stari, r.otkrivanje]));
        setProt(r.protivnik);
        setTrebaZupaniju(r.trebaZupaniju);
        if (r.otkrivanje.dupla) setDuplaIskoristena(true);
        // Kratka stanka prije ispravka: napetost, i vrijeme da "blagajna provjeri".
        setFaza("stanka");
        sviraj("pisac");
        const smanjeno = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        stanka.current = setTimeout(() => {
          setFaza("otkriveno");
          sviraj(r.otkrivanje.razred === "g" || r.otkrivanje.razred === "y" ? "kasa" : r.otkrivanje.razred === "r" ? "promasaj" : "pisac");
        }, smanjeno ? 0 : STANKA_MS);
      } catch {
        setGreska("Veza je pukla. Provjeri internet pa pokušaj ponovno.");
      }
    });
  }

  function sljedeca() {
    if (i >= zadnja) {
      router.push("/racun");
      return;
    }
    setI(i + 1);
    setPogodak(set[i + 1].st);
    setDupla(false);
    setFaza("pitanje");
  }

  function dalje() {
    if (!trebaZupaniju) {
      sljedeca();
      return;
    }
    setGreska(null);
    startTransition(async () => {
      try {
        const r = await upisiKupca(zupanija, nadimak);
        if ("greska" in r) {
          setGreska(r.greska);
          return;
        }
        setTrebaZupaniju(false);
        sljedeca();
      } catch {
        setGreska("Veza je pukla. Provjeri internet pa pokušaj ponovno.");
      }
    });
  }

  function pomak(smjer: number) {
    setPogodak((v) => zaokruzi(Math.max(0, Math.min(a.max, v + smjer * a.f))));
  }

  const skok = o ? o.prava / a.st - 1 : 0;
  const isto = Math.abs(skok) < 0.005;
  const rast = pogodak / a.st - 1;
  const rundaTekst = !o ? "" : o.ishod === 1 ? "Runda tebi." : o.ishod === -1 ? (prot?.bot ? "Runda Ruži." : "Runda njemu.") : "Neriješeno.";

  return (
    <>
      <div className="list">
        <section className="papir" aria-label="Današnji račun">
          {/* Prije prvog odgovora račun još nije otvoren: bez zaglavlja, da prva stavka bude što bliže vrhu. */}
          {prot || otkriveno.length > 0 ? (
            <>
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
                <span>{prot ? (prot.bot ? `${prot.ime} (računalo)` : `${prot.ime}${prot.zupanija ? `, ${prot.zupanija}` : ""}`) : (p.izazivac ?? "protivnik čeka")}</span>
              </div>
              <hr className="crta" />
            </>
          ) : null}

          {otkriveno.slice(0, i).map((x, j) => (
            <div className="proslo" key={set[j].ime}>
              <div className="red">
                <span>{set[j].ime}</span>
                <span>
                  {x.dupla ? "dupla " : ""}+{x.bodovi}
                </span>
              </div>
              <div className="trag">
                <span>{nekad(set[j])}</span>
                <span className={"ruka" + (x.razred === "g" ? "" : " krizano")}>{eur(x.moj, set[j].cijeli)}</span>
                <span className="ruka crv">{eur(x.prava, set[j].cijeli)}</span>
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
              <div className={"ispravak" + (o.razred === "g" ? " mrlja" : o.razred === "r" ? " upitnik" : "")}>
                <span className={"ruka mala" + (o.razred === "g" ? "" : " krizano")}>{eur(o.moj, a.cijeli)}</span>
                <span className="ruka crv zaokruzeno ispis">{eur(o.prava, a.cijeli)}</span>
                <span className={"naljepnica lupi" + (isto ? " isto" : "")}>{isto ? "ista cijena" : post(skok)}</span>
              </div>
              <p className="ruka crv komentar">{dosjetka(o.razred, o.moj, o.prava, dan + i)}</p>
              {prot ? (
                <p className="ruka olo suparnik">
                  {prot.ime}: {eur(o.njegov, a.cijeli)}. {rundaTekst}
                </p>
              ) : null}
              <div className="bodovi">
                <span>
                  {PECAT[o.razred]}
                  {o.dupla ? (o.bodovi > 0 ? ", dupla prošla" : ", dupla pala") : ""}
                </span>
                <span>+{o.bodovi}</span>
              </div>
              {o.kupci ? (
                <p className="kupci">
                  Bliži si cijeni od {o.kupci.boljiOd} % kupaca. Sredina svih odgovora: {eur(o.kupci.medijan, a.cijeli)}.{" "}
                  {o.kupci.prenisko >= 60 ? `${o.kupci.prenisko} % ih je reklo premalo.` : o.kupci.prenisko <= 40 ? `${100 - o.kupci.prenisko} % ih je reklo previše ili točno.` : ""}
                </p>
              ) : (
                <p className="kupci">Usporedba s ostalim kupcima stiže čim ih nekoliko odgovori na ovu stavku.</p>
              )}
              <p className="sitno">
                {a.procjena ? "Današnja cijena je procjena za rujan 2026.: službeni prosjek uvećan za rast cijena te skupine proizvoda. " : ""}
                Izvor:{" "}
                <a href={o.izvor.u} target="_blank" rel="noopener noreferrer">
                  {o.izvor.n}
                </a>
              </p>
              {trebaZupaniju ? (
                <div className="obrazac kome">
                  <p>Kome idu ovi bodovi?</p>
                  <div className="polje">
                    <label htmlFor="zupanija">Županija za koju igraš</label>
                    <select id="zupanija" value={zupanija} onChange={(e) => setZupanija(e.target.value)}>
                      <option value="">odaberi</option>
                      {ZUPANIJE.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="polje">
                    <label htmlFor="nadimak">Nadimak, ako želiš na ljestvicu</label>
                    <input type="text" id="nadimak" maxLength={16} autoComplete="off" placeholder="Kralj akcija" value={nadimak} onChange={(e) => setNadimak(e.target.value)} />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="upis">
                <span className="sitno">{a.procjena ? "Danas (procjena)" : "Danas"}</span>
                <span className="ruka" aria-live="off">
                  {eur(pogodak, a.cijeli)}
                </span>
              </div>
              {faza === "stanka" ? (
                <p className="ruka crv stanka" role="status">
                  Blagajna provjerava
                </p>
              ) : (
                <p className="rast">{Math.abs(rast) < 0.005 ? `isto kao ${a.god}` : `${post(rast)} u odnosu na ${a.god}`}</p>
              )}
              {suparnik && faza === "pitanje" ? <p className="ruka olo ceka-te">{suparnik} je već upisao svoju cijenu.</p> : null}
            </>
          )}
        </section>
      </div>

      {o ? (
        <>
          {greska ? (
            <p className="greska na-stolu" role="alert">
              {greska}
            </p>
          ) : null}
          <button className="tipka na-stolu-tipka" onClick={dalje} disabled={ceka}>
            {ceka ? "Upisujem" : trebaZupaniju ? "Upiši i nastavi" : i === zadnja ? "Izdaj račun" : i === zadnja - 1 ? "Okreni račun" : "Sljedeća stavka"}
          </button>
        </>
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
              disabled={ceka || faza !== "pitanje"}
            />
            <div className="raspon">
              <span>{eur(0, a.cijeli)}</span>
              <span>{eur(a.max, a.cijeli)}</span>
            </div>
            <div className="fino">
              <button type="button" onClick={() => pomak(-1)} disabled={ceka || faza !== "pitanje"} aria-label={`Smanji za ${eur(a.f, a.cijeli)}`}>
                − {eur(a.f, a.cijeli)}
              </button>
              <button type="button" onClick={() => pomak(1)} disabled={ceka || faza !== "pitanje"} aria-label={`Povećaj za ${eur(a.f, a.cijeli)}`}>
                + {eur(a.f, a.cijeli)}
              </button>
            </div>
          </div>
          {!duplaIskoristena ? (
            <button type="button" className={"dupla" + (dupla ? " da" : "")} aria-pressed={dupla} onClick={() => setDupla(!dupla)} disabled={ceka || faza !== "pitanje"}>
              <b>{dupla ? "Dupla je na ovoj stavci" : "Igraj duplu na ovu stavku"}</b>
              <span>Jednom po računu. Unutar 15 % cijene bodovi se udvostruče, inače nula.</span>
            </button>
          ) : null}
          {greska ? (
            <p className="greska na-stolu" role="alert">
              {greska}
            </p>
          ) : null}
          <button className="tipka na-stolu-tipka" onClick={zakljucaj} disabled={ceka || faza !== "pitanje"}>
            {ceka || faza === "stanka" ? "Provjeravam" : "Zaključaj cijenu"}
          </button>
          {prot?.bot && i === 1 ? <p className="napomena na-stolu">Danas si među prvima, pa igraš protiv računala. Čim netko drugi završi račun, dvoboji su stvarni.</p> : null}
        </div>
      )}
    </>
  );
}
