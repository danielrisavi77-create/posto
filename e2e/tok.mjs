// Prolaz kroz cijelu igru s tri igrača. Pokretanje:
//   POSTO_MEMORIJA=1 npm run build && POSTO_MEMORIJA=1 npx next start -p 3111 &
//   npm run e2e
// Server mora biti svjež (prazna pohrana), inače provjere koje očekuju prvog igrača dana padaju.
import puppeteer from "puppeteer-core";

const B = process.env.POSTO_E2E_URL ?? "http://localhost:3111";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const SLIKE = process.env.POSTO_E2E_SLIKE ?? "";
const RACUN = 'section[aria-label="Tvoj račun"]';

const br = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox", "--disable-gpu"] });
const ok = (uvjet, opis) => {
  console.log((uvjet ? "OK   " : "FAIL ") + opis);
  if (!uvjet) process.exitCode = 1;
};
const greske = [];
async function stranica() {
  const ctx = await br.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 390, height: 780 });
  p.on("pageerror", (e) => greske.push(String(e)));
  p.on("response", (r) => r.status() >= 400 && greske.push(`HTTP ${r.status()} ${r.url()}`));
  return p;
}
const tekst = (p, sel) => p.$eval(sel, (e) => e.innerText);
const slika = (p, ime) => (SLIKE ? p.screenshot({ path: `${SLIKE}/${ime}.png`, fullPage: !process.env.POSTO_E2E_EKRAN }) : null);

async function igraj(p, zupanija, nadimak, faktor, o = {}) {
  const pocni = await p.$("button.pocni");
  if (pocni) await pocni.click();
  for (let i = 0; i < 4; i++) {
    await p.waitForSelector("#klizac:not([disabled])");
    if (i === o.refreshNa) {
      await p.reload();
      await p.waitForSelector("#klizac:not([disabled])");
    }
    if (i === 0) {
      const html = (await p.content()).replace(/<style[\s\S]*?<\/style>/g, "");
      ok(!/1,19|1\.19/.test(html), "današnja cijena prve stavke nije u HTML-u prije odgovora");
    }
    await p.$eval("#klizac", (el, f) => {
      const postavi = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      postavi.call(el, String(Number(el.max) * f));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, faktor);
    if (i === o.duplaNa) await p.click("button.dupla");
    if (i === 1 && o.slike) await slika(p, "pitanje");
    await p.click(".traka-dolje button.tipka");
    await p.waitForSelector(".ispravak");
    if (i === 0 && o.slike) await slika(p, "prva-stavka");
    if (i === 1 && o.slike) {
      await new Promise((r) => setTimeout(r, 900));
      await slika(p, "otkrivanje");
    }
    await p.click(".traka-dolje button.tipka");
  }
  await p.waitForSelector(RACUN);
  if (o.bezUpisa) return;
  if (o.slike) await slika(p, "racun-prije-upisa");
  await p.select("#zupanija", zupanija);
  if (nadimak) await p.type("#nadimak", nadimak);
  await p.click('section[aria-label="Upis na ljestvicu"] button.tipka');
  await p.waitForFunction(() => !document.querySelector("#zupanija"));
}

// Igrač A: prvi dana, bez obrasca prije igre
const a = await stranica();
await a.goto(B);
ok((await a.$("#klizac")) === null, "početna ne sadrži igru");
ok(/Derbi dana/.test(await tekst(a, "#app")), "početna najavljuje derbi dana");
await slika(a, "pocetna");
await Promise.all([a.waitForNavigation(), a.click('a.tipka[href="/igraj"]')]);
ok(new URL(a.url()).pathname === "/igraj", "tipka s početne vodi na zasebnu stranicu igre");
ok((await a.$("button.pocni")) !== null && (await a.$("#zupanija")) === null, "igra počinje pričom o računu, bez obrasca");
await slika(a, "igraj");
await a.click("button.pocni");
await a.waitForSelector("#klizac:not([disabled])");
ok((await a.$(".vinjeta")) !== null, "stavka ima vinjetu");
await slika(a, "prva");
ok((await a.$(".mjerilo")) !== null && (await a.$$(".skokovi button")).length === 5, "cijena se bira mjernom trakom i brzim skokovima");
await a.click(".skokovi button:nth-child(3)");
ok(/\+(49|50|51)\s%/.test(await tekst(a, ".rast")), "brzi skok postavlja cijenu u odnosu na staru");
{
  const prije = await tekst(a, ".upis .ruka");
  const kut = await (await a.$(".mjerilo")).boundingBox();
  await a.mouse.move(kut.x + kut.width / 2, kut.y + 30);
  await a.mouse.down();
  await a.mouse.move(kut.x + kut.width / 2 - 70, kut.y + 30, { steps: 5 });
  await a.mouse.up();
  ok((await tekst(a, ".upis .ruka")) !== prije, "povlačenje mjerne trake mijenja cijenu");
}
await igraj(a, "Grad Zagreb", "Daniel", 0.4, { refreshNa: 2, slike: true, bezUpisa: true });
ok(/Tvoje cijene su iz (\d{4}|prošlog stoljeća)\./.test(await tekst(a, ".presuda")), "račun počinje presudom o godini cijena");
ok(/Moje cijene su iz .+ A tvoje\?/.test(await tekst(a, "pre.poruka")), "poruka za dijeljenje nosi presudu");
ok(/Anonimni kupac/.test(await tekst(a, RACUN)) && !/Blagajna/.test(await tekst(a, RACUN)), "račun se može platiti bez županije i nadimka");
await slika(a, "racun-prije-upisa");
await a.select("#zupanija", "Grad Zagreb");
await a.type("#nadimak", "Daniel");
await a.click('section[aria-label="Upis na ljestvicu"] button.tipka');
await a.waitForFunction(() => !document.querySelector("#zupanija"));
ok(/Kupac\s+Daniel/.test(await tekst(a, RACUN)) && /Blagajna\s+Grad Zagreb/.test(await tekst(a, RACUN)), "naknadni upis nadimka i županije vrijedi za plaćeni račun");
ok(/Blagajnica Ruža \(računalo\)/.test(await tekst(a, RACUN)), "prvi igrač dana igra protiv označenog računala");
const link = (await tekst(a, "pre.poruka")).trim().split("\n").pop();
ok(/\/izazov\/[a-z0-9]{8}$/.test(link), "link izazova postoji");
ok(/Kažem da je .+: .+€/.test(await tekst(a, "pre.poruka")), "poruka za dijeljenje ima mamac bez točne cijene");
await a.goto(B);
ok(/Pogledaj svoj račun/i.test(await tekst(a, "#app")) && (await a.$('a[href="/igraj"].tipka')) === null, "početna nakon igre vodi na račun, ne na novu igru");
await slika(a, "pocetna-nakon");
await a.goto(B + "/igraj");
ok(new URL(a.url()).pathname === "/racun", "drugi pokušaj istog dana je zaključan");

// Slike: pregled linka i slika računa
const put = link.replace(/^https?:\/\/[^/]+/, "");
const b = await stranica();
await b.goto(B + put);
const og = await b.$eval('meta[property="og:image"]', (m) => m.content).catch(() => "");
ok(og.includes("/izazov/"), "stranica izazova ima svoju og:image");
for (const [ime, url] of [["og-izazov", new URL(og, B).pathname + new URL(og, B).search], ["slika-racuna", put + "/slika"]]) {
  const odgovor = await fetch(B + url);
  ok(odgovor.status === 200 && odgovor.headers.get("content-type") === "image/png", `${ime} se generira kao PNG`);
  if (SLIKE) (await import("node:fs/promises")).writeFile(`${SLIKE}/${ime}.png`, Buffer.from(await odgovor.arrayBuffer()));
}

// Igrač B: link izazova vodi ravno u dvoboj, igra duplu na drugoj stavci
ok(/Daniel \(Grad Zagreb\) te izaziva/i.test(await tekst(b, "#app")), "izazvani vidi tko ga izaziva");
ok((await b.$("#klizac")) !== null, "izazov otvara prvu stavku bez međukoraka");
await slika(b, "izazov");
await igraj(b, "Splitsko-dalmatinska", "Ante<script>", 0.5, { duplaNa: 1 });
const rb = await tekst(b, RACUN);
ok(/protiv: Daniel, Grad Zagreb/.test(rb), "dvoboj je protiv igrača koji je izazvao");
ok(/Kupac\s+Antescript/.test(rb), "nadimak je očišćen od znakova");
ok(/dupla \+\d+/.test(rb), "dupla je upisana na račun");
ok((await b.$$(".tablica tbody tr")).length === 2, "liga županija ima obje županije");
await slika(b, "racun");

// Igrač C: nepristojan nadimak, usporedba s ostalim kupcima
const c = await stranica();
await c.goto(B + "/igraj");
await igraj(c, "Istarska", "K.u.r.4.c", 0.3);
const rc = await tekst(c, RACUN);
ok(/Kupac\s+Anonimni kupac/.test(rc), "nepristojan nadimak se ne prikazuje");
ok(!/računalo/.test(rc.split("TI I OSTALI")[0]), "treći igrač dobiva stvarnog protivnika");
ok(/kupci .+ \(bliži si od \d+ %\)/.test(rc), "račun uspoređuje odgovore s ostalim kupcima");
ok(/Danas si\s+\d\. od 3/.test(rc), "račun pokazuje mjesto među današnjim kupcima");

// Ljestvice
await c.goto(B + "/ljestvica");
await c.evaluate(() => [...document.querySelectorAll(".kartice button")].find((x) => x.textContent.includes("Igrači danas")).click());
ok((await c.$$(".tablica tbody tr")).length === 3, "ljestvica igrača danas ima sva tri igrača");
ok((await c.$$(".tablica tr.moj")).length === 1, "vlastiti red je označen");

// Privatna liga: A osniva, B ulazi preko linka
await a.goto(B + "/liga");
await a.type("#naziv", "Ured treći kat");
await Promise.all([a.waitForNavigation(), a.click("form:has(#naziv) button[type=submit]")]);
const ligaUrl = a.url();
ok(/\/liga\/[a-z0-9]{6}$/.test(ligaUrl), "liga je osnovana i ima svoj kod");
await b.goto(ligaUrl);
await Promise.all([b.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}), b.click("form button[type=submit]")]);
await b.goto(ligaUrl);
ok((await b.$$(".tablica tbody tr")).length === 2, "nakon ulaska liga ima dva člana");
await slika(b, "liga");

// Knjižica, Veliki račun, izvori i ostale stranice
await a.goto(B + "/ja");
ok(/KNJIŽICA KUPCA/.test(await tekst(a, "#app")), "knjižica kupca se otvara");
await a.goto(B + "/veliki-racun");
ok(/skupljeno 1 od/.test(await tekst(a, "#app")), "Veliki račun zbraja odigrane račune sezone");
await a.goto(B + "/izvori");
ok(/procjena/.test(await tekst(a, "#app")), "stranica o izvorima objašnjava procjene");
const d = await stranica();
await d.goto(B + "/izazov/nepostoji");
ok(/ne postoji/i.test(await tekst(d, "#app")), "nepostojeći izazov ima jasnu poruku");
await d.goto(B + "/privatnost");
ok(/Voditelj obrade/i.test(await tekst(d, "#app")), "stranica privatnosti se otvara");
await d.goto(B + "/racun");
ok(new URL(d.url()).pathname === "/igraj", "račun bez odigrane igre vodi na igru");

ok(greske.length === 0, "nema JS grešaka ni neuspjelih zahtjeva " + greske.join("; "));
await br.close();
