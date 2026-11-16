# Pošto?

Dnevna igra: pronađeni stari račun u kunama, pogađaš koliko iste stvari koštaju danas. Dvoboj protiv igrača iz druge županije, liga županija po sezoni (mjesec), ljestvice igrača, privatne lige, link izazova, Veliki račun sezone.

Stack: Next.js 16 (App Router, TypeScript strict), Supabase (Postgres), bez prijave.

## Pokretanje lokalno

```bash
npm install
npm run dev
```

Bez Supabase varijabli aplikacija u razvoju koristi pohranu u memoriji (podaci nestaju pri restartu). To je dovoljno za rad na sučelju.

## Postavljanje Supabasea

1. Otvori novi projekt na supabase.com (regija Frankfurt).
2. SQL Editor: zalijepi i pokreni redom sve datoteke iz `supabase/migrations/` (0001 do 0005).
3. Advisors, Security: pokreni provjeru. Očekivano stanje: RLS uključen na svih pet tablica, bez politika (namjerno, pristup ide samo preko servera).
4. Project Settings, API: kopiraj Project URL i `service_role` ključ.

## Varijable okruženja

Vidi `.env.example`. Lokalno ih stavi u `.env.local`.

| Varijabla | Čemu služi |
|---|---|
| `SUPABASE_URL` | adresa projekta |
| `SUPABASE_SERVICE_ROLE_KEY` | tajni ključ, samo server. Nikad s prefiksom `NEXT_PUBLIC_` |
| `POSTO_SITE_URL` | javna adresa za linkove izazova |
| `POSTO_POCETAK` | datum računa br. 1 (zagrebačko vrijeme) |
| `POSTO_SOL` | sol za sažetak IP adrese kod ograničenja zahtjeva |
| `POSTO_VODITELJ`, `POSTO_KONTAKT` | podaci na stranici `/privatnost` |

## Deploy na Netlify

Git deploy (ne drag and drop). Build naredba `npm run build`, Netlify sam prepozna Next.js. Varijable upiši u Site configuration, Environment variables, pa pokreni novi build: vrijede tek nakon builda.

## Kako je složeno

```
src/lib/racuni.ts      ručno uneseni računi, izvori, raspored (SAMO SERVER)
src/lib/racuni-dzs.ts  računi generirani iz DZS-a i Eurostata (ne uređuje se ručno)
scripts/sadrzaj/       skripta i izvorni podaci za generiranje računa
src/lib/statistika.ts  knjižica kupca i Veliki račun
src/lib/liga.ts        privatne lige
src/lib/tablice.ts     priprema ljestvica za prikaz
src/app/ljestvica/     županije, igrači danas, igrači u sezoni
src/app/liga/          moje lige i stranica lige
src/app/veliki-racun/  zbroj svih košarica sezone
src/app/ja/            knjižica kupca i ladica računa
src/lib/derbi.ts       derbi dana: parovi županija i ishod
src/app/izvori/        izvori i metoda procjene cijena
src/lib/bodovanje.ts   čiste funkcije: bodovi, razredi, osjećaj inflacije, formatiranje
src/lib/dan.ts         redni broj dana, sezona, ponoć: sve po zagrebačkom vremenu
src/lib/pohrana.ts     sloj pohrane: Supabase i memorija iza istog sučelja
src/lib/igra.ts        pravila: start, protivnik, pogodak, otkrivanje
src/app/akcije.ts      server akcije koje zove klijent
src/app/page.tsx       početna i igra
src/app/racun/         završni račun, dijeljenje, liga, ladica
src/app/izazov/[kod]/  stranica izazova i njezina slika za pregled linka
src/app/privatnost/    nacrt pravila privatnosti
src/lib/og.tsx         slike za pregled linka (fontovi su u assets/fonts)
e2e/tok.mjs            test cijelog toka s tri igrača
docs/SADRZAJ.md        pravila za dodavanje računa i stanje provjere izvora
prototip/              prvi prototip u jednoj HTML datoteci
```

Ključna pravila:

- Današnja cijena (`c`) nikad ne ide klijentu prije nego što igrač zaključa pogodak. `javniRacun()` eksplicitno nabraja polja koja smiju van.
- Jedna igra po igraču po danu: `unique (dan, igrac_id)`. Runde se upisuju atomarno funkcijom `dodaj_pogodak`, pa dvostruki klik ili dva taba ne mogu upisati istu rundu dvaput.
- Protivnik: tko te izazvao linkom, inače nasumičan stvarni igrač iz druge županije koji je račun već završio, inače računalo (uvijek označeno kao računalo).
- Igrač je anonimni httpOnly kolačić s nasumičnim UUID-om.
- Nema obrasca prije igre: prvi odgovor otvara račun, a županija se bira nakon prve stavke. Stranica se pritom osvježi, pa `<Igra>` mora ostati na istom mjestu u stablu (stalni `key`).
- Dupla: jednom po računu, dvostruki bodovi unutar 15 % cijene, inače nula.
- Slike za dijeljenje (`/izazov/[kod]/slika` i og:image) nikad ne sadrže današnje cijene, samo igračeve odgovore.
- Ograničenje zahtjeva po mreži: 30 novih računa na sat i 120 pogodaka u minuti. IP se sprema samo kao sažetak sa solju i briše se nakon jednog dana (pri svakom pozivu i satnim pg_cron poslom).

## Testovi

```bash
POSTO_MEMORIJA=1 npm run build
POSTO_MEMORIJA=1 npx next start -p 3111 &
npm run e2e
```

Treba Chrome (`CHROME_PATH`). Server mora biti svjež jer test očekuje praznu pohranu.

## Sadržaj

Vidi `docs/SADRZAJ.md`. Ukratko: 25 računa generira `python3 scripts/sadrzaj/slozi.py`, 4 su ručno unesena u `src/lib/racuni.ts`. Svaki račun ima stabilan `id` koji se sprema uz igru, pa stare igre ostaju na svom računu i kad se raspored promijeni. Novi sadržaj objavljuj oko ponoći.

## Dizajn

Stol s kariranim stolnjakom i papiri na njemu: požutjeli kunski račun, termo račun, kemijska kojom igrač upisuje cijenu, crvena olovka koja ispravlja, žuta naljepnica s postotkom, izrezak iz novina s tablicom. Sve boje i fontovi su tokeni na vrhu `src/app/globals.css`.

## Poznata ograničenja

- 29 računa: trideseti dan sezone ponavlja prvi. Današnje cijene na 25 računa su procjene (vidi `docs/SADRZAJ.md`).
- Brisanje kolačića i dalje omogućuje ponovnu igru istog dana, do granice od 30 računa na sat po mreži. Za nagrade treba jača zaštita.
- Filter nadimaka je kratak popis korijena, ne moderacija.
- Stranica `/privatnost` je nacrt: upisati voditelja obrade i dati pravniku na provjeru.
- Na dan pomicanja sata odbrojavanje do ponoći može odstupati do sat vremena.
- Fontovi na stranici učitavaju se s Google Fontsa. Za strožu privatnost prebaciti ih na vlastiti poslužitelj.
