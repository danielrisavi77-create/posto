import { kune, zbroj } from "@/lib/bodovanje";
import type { JavniRacun } from "@/lib/racuni";

export function Zaglavlje({ dan, datum }: { dan: number; datum: string }) {
  return (
    <div className="zaglavlje">
      <div className="logo mali">POŠTO?</div>
      <div className="broj-dana">
        Račun br. {dan}
        <br />
        {datum}
      </div>
    </div>
  );
}

/** Stari kunski račun: prve četiri stavke (finale nije na njemu). */
export function StariRacun({ racun }: { racun: JavniRacun }) {
  const stavke = racun.set.slice(0, 4);
  const ukupno = zbroj(stavke.map((a) => a.kn ?? 0));
  return (
    <div className="stari" aria-label="Stari račun">
      <p className="sred">
        *** RAČUN ***
        <br />
        {racun.god}
      </p>
      <hr />
      {stavke.map((a) => (
        <div className="r" key={a.ime}>
          <span>
            {a.ime}
            {racun.mjesovit ? ` (${a.god})` : ""}
          </span>
          <span>{a.kn != null ? kune(a.kn) : ""}</span>
        </div>
      ))}
      <hr />
      <div className="r uk">
        <span>UKUPNO</span>
        <span>{kune(ukupno)}</span>
      </div>
      <span className="zig">plaćeno u kunama</span>
    </div>
  );
}
