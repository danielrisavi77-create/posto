// Prolaz kroz cijelu igru s tri igrača. Pokretanje:
//   POSTO_MEMORIJA=1 npm run build && POSTO_MEMORIJA=1 npx next start -p 3111 &
//   npm run e2e
// Server mora biti svjež (prazna pohrana), inače provjera "prvi igrač dana" pada.
import puppeteer from "puppeteer-core";

const B = process.env.POSTO_E2E_URL ?? "http://localhost:3111";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const SLIKE = process.env.POSTO_E2E_SLIKE ?? "";

const br = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox", "--disable-gpu"] });
const ok = (uvjet, opis) => {
  console.log((uvjet ? "OK   " : "FAIL ") + opis);
  if (!uvjet) process.exitCode = 1;
};
const greske = [];
async function stranica() {
  const ctx = await br.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 420, height: 900 });
  p.on("pageerror", (e) => greske.push(String(e)));
  p.on("response", (r) => r.status() >= 400 && greske.push(`HTTP ${r.status()} ${r.url()}`));
  return p;
}
async function igraj(p, zupanija, nadimak, faktor, refreshNa = -1) {
  await p.select("#zupanija", zupanija);
  if (nadimak) await p.type("#nadimak", nadimak);
  await p.click("button[type=submit]");
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector("#klizac");
    if (i === refreshNa) {
      await p.reload();
      await p.waitForSelector("#klizac");
    }
    if (i === 0) {
      const html = (await p.content()).replace(/<style[\s\S]*?<\/style>/g, "");
      ok(!/1,19|1\.19/.test(html), "današnja cijena prve stavke nije u HTML-u prije pogotka");
    }
    await p.$eval("#klizac", (el, f) => {
      const postavi = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      postavi.call(el, String(Number(el.max) * f));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, faktor);
    await (await p.$("section.kartica > button.gumb")).click();
    await p.waitForSelector(".usporedba");
    await (await p.$("section.kartica > button.gumb")).click();
  }
  await p.waitForSelector(".racun");
}
const tekst = (p, sel) => p.$eval(sel, (e) => e.innerText);

// Igrač A: prvi dana
const a = await stranica();
await a.goto(B);
await a.click("button[type=submit]");
ok((await a.$("#klizac")) === null, "submit bez županije ne pokreće igru");
await igraj(a, "Grad Zagreb", "Daniel", 0.4, 2);
ok(/Blagajnica Ruža \(računalo\)/.test(await tekst(a, ".racun")), "prvi igrač dana igra protiv označenog računala");
const link = (await tekst(a, ".dijeli pre")).trim().split("\n").pop();
ok(/\/izazov\/[a-z0-9]{8}$/.test(link), "link izazova postoji");
await a.goto(B);
ok(/Pogledaj današnji račun/i.test(await tekst(a, "#app")), "drugi pokušaj istog dana je zaključan");

// Slika pregleda linka
const put = link.replace(/^https?:\/\/[^/]+/, "");
const b = await stranica();
await b.goto(B + put);
const og = await b.$eval('meta[property="og:image"]', (m) => m.content).catch(() => "");
ok(og.includes("/izazov/"), "stranica izazova ima svoju og:image");
const odgovor = await fetch(B + new URL(og, B).pathname + new URL(og, B).search);
ok(odgovor.status === 200 && odgovor.headers.get("content-type") === "image/png", "og:image se generira kao PNG");
if (SLIKE) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(`${SLIKE}/og-izazov.png`, Buffer.from(await odgovor.arrayBuffer()));
  await b.screenshot({ path: `${SLIKE}/izazov.png`, fullPage: true });
}

// Igrač B: preko izazova
ok(/Daniel te izaziva/i.test(await tekst(b, "#app")), "izazvani vidi tko ga izaziva i rezultat");
await Promise.all([b.waitForNavigation(), b.click("form button[type=submit]")]);
ok(/Izaziva te Daniel \(Grad Zagreb\)/i.test(await tekst(b, "#app")), "nakon prihvaćanja početna pamti izazov");
await igraj(b, "Splitsko-dalmatinska", "Ante<script>", 0.5);
const rb = await tekst(b, ".racun");
ok(/protiv Daniel \(Grad Zagreb\)/.test(rb), "dvoboj je protiv igrača koji je izazvao");
ok(/Kupac: Antescript/.test(rb), "nadimak je očišćen od znakova");
ok((await b.$$(".derbi .red")).length === 2, "liga ima obje županije");
if (SLIKE) await b.screenshot({ path: `${SLIKE}/racun.png`, fullPage: true });

// Igrač C: bez izazova, nepristojan nadimak
const c = await stranica();
await c.goto(B);
await igraj(c, "Istarska", "K.u.r.4.c", 0.3);
const rc = await tekst(c, ".racun");
ok(/Kupac: Anonimni kupac/.test(rc), "nepristojan nadimak se ne prikazuje");
ok(!/računalo/.test(rc.split("KOLIKO")[0]), "treći igrač dobiva stvarnog protivnika");

// Ostale stranice
const d = await stranica();
await d.goto(B + "/izazov/nepostoji");
ok(/ne postoji/i.test(await tekst(d, "#app")), "nepostojeći izazov ima jasnu poruku");
await d.goto(B + "/privatnost");
ok(/Voditelj obrade/i.test(await tekst(d, "#app")), "stranica privatnosti se otvara");
await d.goto(B + "/racun");
ok(new URL(d.url()).pathname === "/", "račun bez odigrane igre vraća na početnu");

ok(greske.length === 0, "nema JS grešaka ni neuspjelih zahtjeva " + greske.join("; "));
await br.close();
