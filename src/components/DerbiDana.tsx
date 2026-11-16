import { ishodDerbija, type Derbi } from "@/lib/derbi";

/** Derbi dana: dvije županije, trenutni prosjek, i jučerašnji ishod kao razlog za povratak. */
export function DerbiDana({ danas, jucer, mojaZupanija }: { danas: Derbi; jucer: Derbi | null; mojaZupanija?: string }) {
  const mojDerbi = mojaZupanija && (danas.a === mojaZupanija || danas.b === mojaZupanija);
  const jucerTekst = jucer ? ishodDerbija(jucer) : null;
  return (
    <section className="na-stolu derbi-dana" aria-label="Derbi dana">
      <span className="napomena">Derbi dana{mojDerbi ? ": igra tvoja županija" : ""}</span>
      <div className="par">
        <span>{danas.a}</span>
        <b>
          {danas.prosjekA ?? "?"} : {danas.prosjekB ?? "?"}
        </b>
        <span>{danas.b}</span>
      </div>
      <span className="napomena">
        Prosjek bodova današnjih računa ({danas.igaraA} i {danas.igaraB}). Zaključuje se u ponoć.
        {jucerTekst ? ` Jučer: ${jucerTekst}` : ""}
      </span>
    </section>
  );
}
