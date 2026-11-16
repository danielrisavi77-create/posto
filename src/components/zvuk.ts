"use client";

// Kratki zvukovi sintetizirani u pregledniku (bez datoteka). Isključuju se gumbom u izborniku.
const KLJUC = "posto-zvuk";
let ctx: AudioContext | null = null;

export function zvukUkljucen(): boolean {
  try {
    return localStorage.getItem(KLJUC) !== "0";
  } catch {
    return true;
  }
}

export function postaviZvuk(ukljucen: boolean): void {
  try {
    localStorage.setItem(KLJUC, ukljucen ? "1" : "0");
  } catch {
    /* privatni način rada: postavka vrijedi do zatvaranja stranice */
  }
}

function ton(c: AudioContext, frekvencija: number, pocetak: number, trajanje: number, oblik: OscillatorType, glasnoca: number, kraj?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = oblik;
  o.frequency.setValueAtTime(frekvencija, c.currentTime + pocetak);
  if (kraj) o.frequency.exponentialRampToValueAtTime(kraj, c.currentTime + pocetak + trajanje);
  g.gain.setValueAtTime(glasnoca, c.currentTime + pocetak);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + pocetak + trajanje);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + pocetak);
  o.stop(c.currentTime + pocetak + trajanje + 0.02);
}

/** kasa: pogodak blizu cijene; pisac: obična runda; promasaj: daleko od cijene. */
export function sviraj(sto: "kasa" | "pisac" | "promasaj"): void {
  if (!zvukUkljucen()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    if (sto === "kasa") {
      ton(ctx, 1319, 0, 0.18, "sine", 0.16);
      ton(ctx, 1760, 0.09, 0.42, "sine", 0.16);
    } else if (sto === "pisac") {
      for (let i = 0; i < 4; i++) ton(ctx, 210 + i * 14, i * 0.045, 0.03, "square", 0.05);
    } else {
      ton(ctx, 196, 0, 0.28, "triangle", 0.14, 104);
    }
    navigator.vibrate?.(sto === "promasaj" ? [20, 40, 20] : 15);
  } catch {
    /* zvuk nije bitan za igru */
  }
}
