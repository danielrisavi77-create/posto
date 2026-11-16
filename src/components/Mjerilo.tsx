"use client";

import { useRef, useState } from "react";
import { eur, zaokruzi } from "@/lib/bodovanje";

const PX = 14; // širina jednog koraka na traci
const POLA = 18; // koliko se koraka crta lijevo i desno od sredine

type Props = { v: number; max: number; k: number; cijeli?: boolean; onemoguceno?: boolean; onChange: (v: number) => void };

/** Mjerna traka: povlačiš je ispod nepomične kazaljke, kao krojački metar. Cijena je uvijek ono što je pod kazaljkom. */
export function Mjerilo({ v, max, k, cijeli, onemoguceno, onChange }: Props) {
  const start = useRef<{ x: number; v: number } | null>(null);
  // Tijekom povlačenja traka klizi glatko, a upisana cijena skače po koracima.
  const [sirovo, setSirovo] = useState<number | null>(null);
  const prikaz = sirovo ?? v;
  const sredina = Math.round(prikaz / k);

  function pomakni(e: React.PointerEvent) {
    if (!start.current) return;
    const novo = Math.max(0, Math.min(max, start.current.v - ((e.clientX - start.current.x) / PX) * k));
    setSirovo(novo);
    const zaokruzeno = zaokruzi(Math.round(novo / k) * k);
    if (zaokruzeno !== v) onChange(zaokruzeno);
  }
  function pusti() {
    start.current = null;
    setSirovo(null);
  }

  const crtice = [];
  for (let n = Math.max(0, sredina - POLA); n <= Math.min(Math.round(max / k), sredina + POLA); n++) {
    const lijevo = `calc(50% + ${((n * k - prikaz) / k) * PX}px)`;
    crtice.push(<i key={n} className={n % 5 === 0 ? "v" : undefined} style={{ left: lijevo }} />);
    if (n % 10 === 0) {
      crtice.push(
        <span key={"t" + n} style={{ left: lijevo }}>
          {eur(zaokruzi(n * k), cijeli)}
        </span>,
      );
    }
  }

  return (
    <div
      className={"mjerilo" + (onemoguceno ? " stoji" : "")}
      aria-hidden="true"
      onPointerDown={(e) => {
        if (onemoguceno) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, v };
      }}
      onPointerMove={pomakni}
      onPointerUp={pusti}
      onPointerCancel={pusti}
    >
      {crtice}
    </div>
  );
}
