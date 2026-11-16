"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { pogodi } from "@/app/akcije";
import { PECAT, dosjetka, eur, kune, post, zaokruzi } from "@/lib/bodovanje";
import type { JavniProtivnik, Otkrivanje } from "@/lib/igra";
import type { JavnaStavka } from "@/lib/racuni";
import { slicica } from "@/lib/slicice";
import { Mjerilo } from "./Mjerilo";
import { sviraj } from "./zvuk";

type Props = {
  dan: number;
  naslov: string;
  /** uvodna priča računa; bez nje (izazov) igra kreće odmah od prve stavke */
  prica?: string;
  god?: string;
  set: JavnaStavka[];
  /** runde koje su već odigrane (refresh usred igre nastavlja gdje je stao) */
  pocetno: Otkrivanje[];
  /** null dok račun nije otvoren: protivnik se dodjeljuje s prvim odgovorom */
  protivnik: JavniProtivnik | null;
  duplaIskoristena: boolean;
  /** kod izazova: prvi odgovor otvara dvoboj protiv izazivača */
  izazov?: string;
  izazivac?: string;
};

function nekad(a: JavnaStavka): string {
  return a.kn != null ? kune(a.kn) : eur(a.st, a.cijeli);
}

// Najkraće trajanje "blagajna provjerava": teče od klika, usporedno sa zahtjevom, pa ne produljuje čekanje.
const STANKA_MS = 400;

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
  const [uvod, setUvod] = useState(!!p.prica && p.pocetno.length === 0 && !p.protivnik);
  const [dupla, setDupla] = useState(false);
  const [duplaIskoristena, setDuplaIskoristena] = useState(p.duplaIskoristena);
  const [prot, setProt] = useState<JavniProtivnik | null>(p.protivnik);
  const [greska, setGreska] = useState<string | null>(null);
  const [ceka, startTransition] = useTransition();
  const sidro = useRef<HTMLDivElement>(null);
  const stanka = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sve runde su odigrane, a igrač se vratio na početnu: vodi ga na račun.
  useEffect(() => {
    if (p.pocetno.length >= set.length) router.replace("/racun");
  }, [p.pocetno.length, set.length, router]);

  useEffect(() => {
    if (faza !== "pitanje" || i > 0) sidro.current?.scrollIntoView({ block: "start" });
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
    const kliknuto = Date.now();
    setFaza("stanka");
    sviraj("pisac");
    startTransition(async () => {
      try {
        const r = await pogodi(i, pogodak, dupla, i === 0 ? p.izazov : undefined);
        if ("greska" in r) {
          setGreska(r.greska);
          setFaza("pitanje");
          return;
        }
        setOtkriveno((stari) => (stari.length > i ? stari : [...stari, r.otkrivanje]));
        setProt(r.protivnik);
        if (r.otkrivanje.dupla) setDuplaIskoristena(true);
        const smanjeno = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        stanka.current = setTimeout(() => {
          setFaza("otkriveno");
          sviraj(r.otkrivanje.razred === "g" || r.otkrivanje.razred === "y" ? "kasa" : r.otkrivanje.razred === "r" ? "promasaj" : "pisac");
        }, smanjeno ? 0 : Math.max(0, STANKA_MS - (Date.now() - kliknuto)));
      } catch {
        setGreska("Veza je pukla. Provjeri internet pa pokušaj ponovno.");
        setFaza("pitanje");
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

  function pomak(smjer: number) {
    setPogodak((v) => zaokruzi(Math.max(0, Math.min(a.max, v + smjer * a.f))));
  }

  const skok = o ? o.prava / a.st - 1 : 0;
  const isto = Math.abs(skok) < 0.005;
  const rast = pogodak / a.st - 1;
  const rundaTekst = !o ? "" : o.ishod === 1 ? "Runda tebi." : o.ishod === -1 ? (prot?.bot ? "Runda Ruži." : "Runda njemu.") : "Neriješeno.";

  if (uvod) {
    const stare = set.slice(0, zadnja);
    return (
      <>
        <div className="list">
          <section className="papir stari" aria-label="Pronađeni račun">
            <div className="stavka-glava">
              <div className="vinjeta" aria-hidden="true">
                <span>🧾</span>
              </div>
              <div>
                <span className="kat">
                  Račun br. {dan}
                  {p.god ? `, ${p.god}` : ""}
                </span>
                <h1 className="artikl">{naslov}</h1>
              </div>
            </div>
            <p className="prica">{p.prica}</p>
            <hr className="crta" />
            {stare.map((x) => (
              <div className="red" key={x.ime}>
                <span>
                  <span className="mala-slicica" aria-hidden="true">
                    {slicica(x.ime)}
                  </span>
                  {x.ime}
                </span>
                <span>{nekad(x)}</span>
              </div>
            ))}
            <hr className="crta" />
            <p className="sitno">Četiri stavke i jedno pitanje na poleđini. Za svaku kažeš koliko košta danas, u eurima.</p>
          </section>
        </div>
        <div className="traka-dolje">
          <button className="tipka pocni" onClick={() => setUvod(false)}>
            Otvori račun
          </button>
        </div>
      </>
    );
  }

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
              <span className="ime">{set[j].ime}</span>
              <span className="ruka crv">{eur(x.prava, set[j].cijeli)}</span>
              <span className="bod">
                {x.dupla ? "×2 " : ""}+{x.bodovi}
              </span>
            </div>
          ))}
          {i > 0 ? <hr className="crta" /> : null}

          <div ref={sidro} className="sidro" />
          <div className="stavka-glava">
            <div className="vinjeta" aria-hidden="true">
              <span>{slicica(a.ime)}</span>
            </div>
            <div>
              <span className="kat">
                {i < zadnja ? `Stavka ${i + 1} od ${zadnja}` : "Poleđina računa"}, {a.kat.toLowerCase()}
              </span>
              <h2 className="artikl">{a.ime}</h2>
              <p className="sitno">{a.opis}</p>
            </div>
          </div>
          <div className="red nekad">
            <span>
              Plaćeno {a.god}
              {a.kn != null ? <small>to je {eur(a.st)}</small> : null}
            </span>
            <b>{nekad(a)}</b>
          </div>

          {o ? (
            <>
              <div className={"ispravak" + (o.razred === "g" ? " mrlja" : o.razred === "r" ? " upitnik" : "")}>
                <span className={"ruka mala" + (o.razred === "g" ? "" : " krizano")}>{eur(o.moj, a.cijeli)}</span>
                <span className="ruka crv zaokruzeno ispis">{eur(o.prava, a.cijeli)}</span>
                <span className={"naljepnica lupi" + (isto ? " isto" : "")}>{isto ? "ista cijena" : post(skok)}</span>
              </div>
              <p className="ruka crv komentar">{dosjetka(o.razred, o.moj, o.prava, dan + i)}</p>
              {a.kn != null && o.prava > 0 ? (
                <p className="kupovna">
                  {a.st >= o.prava ? `Tvojih ${kune(a.kn)} i danas plati cijelu stavku.` : `Tvojih ${kune(a.kn)} danas plati ${Math.round((a.st / o.prava) * 100)} % ove stavke.`}
                </p>
              ) : null}
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
            </>
          ) : (
            <>
              <div className="upis">
                <span>{a.kn != null ? "Koliko danas?" : "Koliko je danas?"}</span>
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
              {suparnik && faza === "pitanje" ? <p className="ruka olo ceka-te">{suparnik}: cijena je već upisana.</p> : null}
              {prot?.bot && i === 1 ? <p className="sitno">Danas si među prvima, pa igraš protiv računala. Čim netko drugi završi račun, dvoboji su stvarni.</p> : null}
            </>
          )}
        </section>
      </div>

      <div className="traka-dolje">
        {greska ? (
          <p className="greska" role="alert">
            {greska}
          </p>
        ) : null}
        {o ? (
          <button className="tipka" onClick={sljedeca}>
            {i === zadnja ? "Izdaj račun" : i === zadnja - 1 ? "Okreni račun" : "Sljedeća stavka"}
          </button>
        ) : (
          <>
            <div className="skokovi" role="group" aria-label={`Brzi odabir u odnosu na ${a.god}`}>
              {[0, 0.25, 0.5, 1, 1.5].map((x) => (
                <button key={x} type="button" onClick={() => setPogodak(zaokruzi(Math.min(a.max, Math.round((a.st * (1 + x)) / a.f) * a.f)))} disabled={ceka || faza !== "pitanje"}>
                  {x === 0 ? "isto" : `+${Math.round(x * 100)} %`}
                </button>
              ))}
            </div>
            <div className="klizac">
              <button type="button" className="korak" onClick={() => pomak(-1)} disabled={ceka || faza !== "pitanje"} aria-label={`Smanji za ${eur(a.f, a.cijeli)}`}>
                −
              </button>
              <Mjerilo v={pogodak} max={a.max} k={a.k} cijeli={a.cijeli} onemoguceno={ceka || faza !== "pitanje"} onChange={setPogodak} />
              <input
                type="range"
                id="klizac"
                className="samo-citac"
                aria-label="Današnja cijena"
                min={0}
                max={a.max}
                step={a.k}
                value={pogodak}
                onChange={(e) => setPogodak(zaokruzi(parseFloat(e.target.value)))}
                disabled={ceka || faza !== "pitanje"}
              />
              <button type="button" className="korak" onClick={() => pomak(1)} disabled={ceka || faza !== "pitanje"} aria-label={`Povećaj za ${eur(a.f, a.cijeli)}`}>
                +
              </button>
            </div>
            {dupla ? <p className="dupla-opis">Dupla: unutar 15 % cijene bodovi se udvostruče, inače nula.</p> : null}
            <div className="potvrda">
              {!duplaIskoristena ? (
                <button type="button" className={"dupla" + (dupla ? " da" : "")} aria-pressed={dupla} onClick={() => setDupla(!dupla)} disabled={ceka || faza !== "pitanje"}>
                  Dupla ×2
                </button>
              ) : null}
              <button className="tipka" onClick={zakljucaj} disabled={ceka || faza !== "pitanje"}>
                {ceka || faza === "stanka" ? "Provjeravam" : "Zaključaj cijenu"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
