"use client";

import { useEffect, useState } from "react";
import { postaviZvuk, zvukUkljucen } from "./zvuk";

export function ZvukGumb() {
  const [ukljucen, setUkljucen] = useState(true);
  useEffect(() => setUkljucen(zvukUkljucen()), []);
  return (
    <button
      type="button"
      aria-pressed={ukljucen}
      onClick={() => {
        postaviZvuk(!ukljucen);
        setUkljucen(!ukljucen);
      }}
    >
      {ukljucen ? "Zvuk: da" : "Zvuk: ne"}
    </button>
  );
}
