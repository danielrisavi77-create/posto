"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function dv(n: number): string {
  return String(n).padStart(2, "0");
}

/** Odbrojava od broja sekundi koji je izračunao server (zagrebačko vrijeme), pa ne ovisi o satu uređaja. */
export function Odbrojavanje({ sekundi }: { sekundi: number }) {
  const router = useRouter();
  const [kraj] = useState(() => Date.now() + sekundi * 1000);
  const [s, setS] = useState(sekundi);

  useEffect(() => {
    const t = setInterval(() => {
      const preostalo = Math.max(0, Math.round((kraj - Date.now()) / 1000));
      setS(preostalo);
      if (preostalo === 0) {
        clearInterval(t);
        router.push("/");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [kraj, router]);

  return (
    <b suppressHydrationWarning>
      {dv(Math.floor(s / 3600))}:{dv(Math.floor((s % 3600) / 60))}:{dv(s % 60)}
    </b>
  );
}
