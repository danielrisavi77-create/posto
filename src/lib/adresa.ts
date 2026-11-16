// SAMO SERVER. Javna adresa stranice za linkove koje igrači dijele.
import { headers } from "next/headers";

export async function adresaStranice(): Promise<string> {
  const iz = process.env.POSTO_SITE_URL;
  if (iz) return iz.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
