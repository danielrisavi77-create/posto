# Sadržaj: računi i izvori

Igra vrijedi onoliko koliko su joj cijene točne. Trenutno ima 29 računa: 4 ručno unesena i 25 generiranih iz službenih podataka.

## Generirani računi (prosinac 2022.)

Slaže ih `scripts/sadrzaj/slozi.py` iz dvije spremljene datoteke u `scripts/sadrzaj/podaci/`:

- `dzs-prosjecne-mpc.json`: DZS, Prosječne maloprodajne cijene dobara i usluga u kunama i eurima (103 stavke, rujan 2022. do prosinac 2023.)
- `eurostat-hicp-hr.json`: Eurostat, HICP za Hrvatsku po skupinama ECOICOP-a (prosinac 2022. do rujan 2026.)

Metoda za svaku stavku:

- **nekad** = DZS-ov prosjek za prosinac 2022., zadnji mjesec kune (u kunama i eurima)
- **danas** = DZS-ov prosjek za prosinac 2023. (zadnji objavljeni) pomnožen rastom cijena pripadne skupine od 12/2023. do 9/2026.

Današnja cijena je zato procjena, a ne izmjerena cijena. U igri je označena riječju "procjena", a metoda je opisana na stranici `/izvori`. Svaka od 103 DZS stavke koristi se točno jednom (skripta to provjerava).

Druga strana računa: plaće po županijama (DZS, godišnji prosjek 2022. i prosjek I. do III. 2026.). Od 2024. DZS plaće prati iz drugog izvora, što piše na stranici `/izvori`.

### Osvježavanje

Kad Eurostat objavi novi mjesec: preuzeti indekse (skup `prc_hicp_minr`, geo=HR, unit=I25), spremiti u `eurostat-hicp-hr.json` s novim `zadnji_mjesec`, pokrenuti skriptu i pregledati razlike. Tekst "rujan 2026." u `src/components/Igra.tsx`, `src/app/racun/page.tsx` i `src/app/izvori/page.tsx` treba uskladiti.

## Ručno uneseni računi

| Račun | Izvor | Napomena |
|---|---|---|
| Račun iz zimske jakne | Telegram.hr, 21. 10. 2026. | plaća za 2026. potvrđena DZS-om (lipanj) |
| Ulaznice iz pretinca auta | NP Plitvička jezera (službeni cjenik 2026.), TCN, Dnevnik.hr, HRT | godina cijene zidina (2019.) izvedena je iz rednog broja članka, jer članak nema datum |
| Račun iz bakine ladice | Telegram.hr | kruh: različite vrste 2016. i 2026., piše u opisu stavke |
| Ceker s placa | Telegram.hr (TISUP), Narodne novine | kune za tržnicu preračunate po fiksnom tečaju; minimalna plaća iz uredbi (NN 140/15 i NN 132/25) |

Imena brendova nisu u igri: stavke se zovu generički ("Lješnjak-namaz", "Čajni keks s čokoladom"), a u opisu piše da je riječ o istoj marki u obje godine.

## Pravila za novi račun

1. Svaki par cijena mora imati izvor koji se može otvoriti.
2. Isti proizvod, ista količina. Razlike moraju pisati u opisu, ili se stavka ne koristi.
3. Sezonske cijene imaju sezonu u opisu. Raspon nije cijena.
4. Procjena se uvijek označava poljem `procjena: true`.
5. Svaki račun ima stabilan `id` koji se nikad ne mijenja. Novi računi dodaju se na kraj rasporeda.

## Otvoreno

- Fali jedan račun do pune sezone od 30 dana (30. dan ponavlja prvi račun).
- Godina cijene dubrovačkih zidina (2019.) nije potvrđena iz datiranog izvora.
