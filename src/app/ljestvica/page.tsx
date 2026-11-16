import type { Metadata } from "next";
import Link from "next/link";
import { Tablice } from "@/components/Tablice";
import { Vrh } from "@/components/Zajednicko";
import { igracId } from "@/lib/igra";
import { pohrana } from "@/lib/pohrana";
import { sveLjestvice } from "@/lib/tablice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ljestvice | Pošto?" };

export default async function Ljestvica() {
  const id = await igracId();
  const igrac = id ? await pohrana().igrac(id) : null;
  const kartice = await sveLjestvice(id, igrac?.zupanija ?? null);
  return (
    <>
      <Vrh />
      <Tablice naslov="Ljestvice" kartice={kartice} />
      <p className="na-stolu">
        Želiš tablicu samo za svoju ekipu, obitelj ili ured?{" "}
        <Link className="veza" href="/liga">
          Osnuj ligu
        </Link>
        .
      </p>
    </>
  );
}
