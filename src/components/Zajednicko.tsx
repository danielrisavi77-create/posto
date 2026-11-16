import Link from "next/link";
import { kune, zbroj } from "@/lib/bodovanje";
import type { JavniRacun } from "@/lib/racuni";
import { ZvukGumb } from "./ZvukGumb";

export function Vrh() {
  return (
    <header className="vrh">
      <Link className="znak" href="/" aria-label="Pošto? Početna">
        Pošto?
      </Link>
      <nav className="izbornik" aria-label="Glavni izbornik">
        <Link href="/igraj">Igraj</Link>
        <Link href="/ljestvica">Ljestvice</Link>
        <Link href="/liga">Lige</Link>
        <Link href="/ja">Ja</Link>
        <ZvukGumb />
      </nav>
    </header>
  );
}

export function Papir({ children, stari, nakrivo, oznaka }: { children: React.ReactNode; stari?: boolean; nakrivo?: boolean; oznaka?: string }) {
  return (
    <div className={"list" + (nakrivo ? " nakrivo" : "")}>
      <section className={"papir" + (stari ? " stari" : "")} aria-label={oznaka}>
        {children}
      </section>
    </div>
  );
}

/** Pronađeni kunski račun: prve četiri stavke (peto pitanje je na poleđini). */
export function StariRacun({ racun }: { racun: JavniRacun }) {
  const stavke = racun.set.slice(0, 4);
  const ukupno = zbroj(stavke.map((a) => a.kn ?? 0));
  return (
    <Papir stari nakrivo oznaka="Pronađeni račun u kunama">
      <p className="glava">
        <b>RAČUN</b>
        {racun.god}
      </p>
      <hr className="crta" />
      {stavke.map((a) => (
        <div className="red" key={a.ime}>
          <span>
            {a.ime}
            {racun.mjesovit ? ` (${a.god})` : ""}
          </span>
          <span>{a.kn != null ? kune(a.kn) : ""}</span>
        </div>
      ))}
      <hr className="crta" />
      <div className="red ukupno">
        <span>UKUPNO</span>
        <span>{kune(ukupno)}</span>
      </div>
      <span className="zig">plaćeno u kunama</span>
    </Papir>
  );
}
