# Pošto?

Dnevna igra: pronađeni stari račun u kunama, pogađaš koliko iste stvari koštaju danas. Dvoboj protiv igrača iz druge županije, liga županija po sezoni (mjesec), link izazova.

Stack: Next.js 16 (App Router, TypeScript strict), Supabase (Postgres), bez prijave.

## Pokretanje lokalno

```bash
npm install
npm run dev
```

Bez Supabase varijabli aplikacija u razvoju koristi pohranu u memoriji (podaci nestaju pri restartu). To je dovoljno za rad na sučelju.

## Postavljanje Supabasea

1. Otvori novi projekt na supabase.com (regija Frankfurt).
2. SQL Editor: zalijepi i pokreni redom `supabase/migrations/0001_init.sql` pa `0002_ogranicenja.sql`.
3. Advisors, Security: pokreni provjeru. Očekivano stanje: RLS uključen na sve tri tablice, bez politika (namjerno, pristup ide samo preko servera).
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
src/lib/racuni.ts      sadržaj: računi, stare i današnje cijene, izvori (SAMO SERVER)
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
- Ograničenje zahtjeva po mreži: 30 novih računa na sat i 120 pogodaka u minuti. IP se sprema samo kao sažetak sa solju.

## Testovi

```bash
POSTO_MEMORIJA=1 npm run build
POSTO_MEMORIJA=1 npx next start -p 3111 &
npm run e2e
```

Treba Chrome (`CHROME_PATH`). Server mora biti svjež jer test očekuje praznu pohranu.

## Dodavanje novog računa

U `src/lib/racuni.ts` dodaj objekt u `RACUNI`: četiri stavke i `finale`. Svaka stavka mora imati izvor u `IZVORI`. Dan N dobiva račun `(N - 1) mod broj_računa`, pa se dodavanjem na kraj ne mijenjaju već odigrani dani dok god je broj dana manji od broja računa.

## Poznata ograničenja

- Samo 4 računa: vrte se u krug. Za lansiranje treba barem 30 (vidi `docs/SADRZAJ.md`).
- Brisanje kolačića i dalje omogućuje ponovnu igru istog dana, do granice od 30 računa na sat po mreži. Za nagrade treba jača zaštita.
- Filter nadimaka je kratak popis korijena, ne moderacija.
- Stranica `/privatnost` je nacrt: upisati voditelja obrade i dati pravniku na provjeru.
- Na dan pomicanja sata odbrojavanje do ponoći može odstupati do sat vremena.
- Fontovi na stranici učitavaju se s Google Fontsa. Za strožu privatnost prebaciti ih na vlastiti poslužitelj.
