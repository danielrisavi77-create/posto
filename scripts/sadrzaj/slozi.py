#!/usr/bin/env python3
"""Slaže račune iz službenih podataka i piše src/lib/racuni-dzs.ts.

Pokretanje (iz korijena repoa):  python3 scripts/sadrzaj/slozi.py

Metoda za svaku stavku:
  nekad  = DZS-ova prosječna maloprodajna cijena za prosinac 2022. (zadnji mjesec kune), u kunama i eurima
  danas  = DZS-ova prosječna cijena za prosinac 2023. (zadnja objavljena) pomnožena rastom cijena
           pripadne skupine proizvoda od 12/2023. do 9/2026. prema Eurostatovu HICP-u za Hrvatsku
Današnja cijena je zato PROCJENA, a ne izmjerena cijena, i u igri je tako označena.

Druga strana računa (plaće po županijama): DZS, godišnji prosjek 2022. i prosjek I. do III. 2026.
"""
import json
import math
import os

OVDJE = os.path.dirname(os.path.abspath(__file__))
DZS = json.load(open(os.path.join(OVDJE, "podaci", "dzs-prosjecne-mpc.json"), encoding="utf-8"))
HICP = json.load(open(os.path.join(OVDJE, "podaci", "eurostat-hicp-hr.json"), encoding="utf-8"))
IDX = HICP["indeksi"]
ZADNJI = HICP["zadnji_mjesec"]  # npr. 2026-09

# DZS naziv -> (naziv u igri, opis jedinice, ECOICOP skupina za indeks)
STAVKE = {
    "Bijela riža": ("Bijela riža", "1 kg", "CP01111"),
    "Pšenično brašno, bijelo": ("Bijelo brašno", "1 kg", "CP01112"),
    "Pšenična krupica (gris), obična": ("Pšenična krupica", "1 kg", "CP01119"),
    "Kruh od pšeničnog brašna, bijeli": ("Bijeli kruh", "štruca, 400 do 700 g", "CP011131"),
    "Kruh od pšeničnog brašna, polubijeli": ("Polubijeli kruh", "štruca, 400 do 700 g", "CP011131"),
    "Kruh, miješani": ("Miješani kruh", "štruca, 400 do 700 g", "CP011131"),
    "Pecivo": ("Pecivo", "1 komad", "CP011139"),
    "Krafna": ("Krafna", "1 komad", "CP011139"),
    "Tost": ("Tost", "1 pakiranje", "CP01113"),
    "Tjestenina": ("Tjestenina", "400 do 500 g", "CP01115"),
    "Kukuruzne pahuljice": ("Kukuruzne pahuljice", "250 do 500 g", "CP01114"),
    "Junetina s kostima": ("Junetina s kostima", "1 kg", "CP011221"),
    "Teleća rebra": ("Teleća rebra", "1 kg", "CP011221"),
    "Svinjetina s kostima, kotleti": ("Svinjski kotleti", "1 kg", "CP011222"),
    "Svinjetina bez kosti, but": ("Svinjski but", "1 kg, bez kosti", "CP011222"),
    "Pile": ("Pile", "1 kg", "CP011224"),
    "Šunka u ovitku": ("Šunka u ovitku", "1 kg", "CP01125"),
    "Posebna salama": ("Posebna salama", "1 kg", "CP01125"),
    "Mortadela": ("Mortadela", "1 kg", "CP01125"),
    "Hrenovke, bez dodataka": ("Hrenovke", "200 do 300 g", "CP01125"),
    "Čajna kobasica": ("Čajna kobasica", "1 kg", "CP01125"),
    "Slanina": ("Slanina", "1 kg", "CP01123"),
    "Pašteta": ("Pašteta", "50 do 100 g", "CP01125"),
    "Smrznuti oslić, file": ("Smrznuti oslić", "file, 400 do 500 g", "CP01131"),
    "Sardine u ulju, bez dodataka": ("Sardine u ulju", "konzerva, 100 do 120 g", "CP01133"),
    "Tuna u konzervi, bez dodataka": ("Tuna u konzervi", "100 do 160 g", "CP01133"),
    "Mlijeko, svježe": ("Svježe mlijeko", "1 litra", "CP01141"),
    "Mlijeko, trajno": ("Trajno mlijeko", "1 litra", "CP01141"),
    "Jogurt, obični, čašica": ("Jogurt u čašici", "180 do 200 g", "CP01146"),
    "Sir, polutrvrdi": ("Polutvrdi sir", "1 kg", "CP01145"),
    "Sirni namaz, bez dodataka": ("Sirni namaz", "100 g", "CP01145"),
    "Kokošja jaja": ("Jaja", "10 komada", "CP01148"),
    "Ulje, suncokretovo": ("Suncokretovo ulje", "1 litra", "CP01151"),
    "Maslac": ("Maslac", "250 g", "CP01152"),
    "Margarin, stolni": ("Margarin", "250 g", "CP01153"),
    "Limuni": ("Limuni", "1 kg", "CP01162"),
    "Naranče": ("Naranče", "1 kg", "CP01162"),
    "Banane": ("Banane", "1 kg", "CP01161"),
    "Jabuke": ("Jabuke", "1 kg", "CP01163"),
    "Grah, suhi": ("Suhi grah", "1 kg", "CP01176"),
    "Crveni luk": ("Crveni luk", "1 kg", "CP01174"),
    "Mrkva": ("Mrkva", "1 kg", "CP01174"),
    "Slatko zelje": ("Slatko zelje", "1 kg", "CP01171"),
    "Rajčice": ("Rajčice", "1 kg", "CP01172"),
    "Paprika": ("Paprika", "1 kg", "CP01172"),
    "Tikvice": ("Tikvice", "1 kg", "CP01172"),
    "Kelj": ("Kelj", "1 kg", "CP01171"),
    "Brokula": ("Brokula", "1 kg", "CP01171"),
    "Šampinjoni": ("Šampinjoni", "500 g", "CP01174"),
    "Konzervirani krastavci": ("Kiseli krastavci", "staklenka, oko 670 g", "CP01179"),
    "Krumpiri": ("Krumpir", "1 kg", "CP011751"),
    "Čips, vrećica": ("Čips", "vrećica, 130 do 150 g", "CP01179"),
    "Šećer, kristal": ("Šećer", "1 kg", "CP01181"),
    "Džem": ("Džem", "320 do 450 g", "CP01183"),
    "Med, prirodni": ("Med", "staklenka, oko 1 kg", "CP01183"),
    "Mliječna čokolada bez dodataka": ("Mliječna čokolada", "80 do 100 g", "CP01185"),
    "Napolitanke": ("Napolitanke", "350 do 500 g", "CP011139"),
    "Majoneza, u vrećici": ("Majoneza", "vrećica, 85 do 100 g", "CP01193"),
    "Kuhinjska sol": ("Kuhinjska sol", "1 kg", "CP01193"),
    "Vegeta, obična": ("Vegeta", "250 g", "CP01193"),
    "Dječja instant hrana": ("Dječja kašica", "instant, 150 do 200 g", "CP01192"),
    "Kava, mljevena, s kofeinom": ("Mljevena kava", "175 do 250 g", "CP01220"),
    "Čaj, filter-vrećice, kutija": ("Čaj u vrećicama", "1 kutija", "CP01230"),
    "Mineralna gazirana voda, plastična boca": ("Gazirana mineralna voda", "boca od 1,5 l", "CP01250"),
    "Prirodna negazirana mineralna voda, plastična boca": ("Negazirana voda", "boca od 1,5 l", "CP01250"),
    "Voćni sirup": ("Voćni sirup", "0,7 do 1 l", "CP01290"),
    "Prirodni voćni sok": ("Voćni sok", "1 litra", "CP01210"),
    "Gazirani bezalkoholni napitak": ("Gazirani sok", "boca od 1,5 do 2 l", "CP01260"),
    "Svijetlo pivo, u boci": ("Svijetlo pivo", "boca od 0,5 l", "CP02130"),
    "Vino, bijelo": ("Bijelo vino", "boca od 0,7 do 1 l", "CP02121"),
    "Deterdžent za strojno pranje rublja, u prahu": ("Prašak za rublje", "1 do 1,5 kg", "CP05611"),
    "Tekući deterdžent za ručno pranje posuđa": ("Deterdžent za posuđe", "oko pola litre", "CP05611"),
    "Sirup za ublažavanje kašlja, za odrasle": ("Sirup protiv kašlja", "bočica, 100 do 200 ml", "CP06111"),
    "Tablete za snižavanje tjelesne temperature": ("Tablete protiv temperature", "1 kutija", "CP06111"),
    "Laboratorijske pretrage − kompletna krvna slika": ("Kompletna krvna slika", "privatni laboratorij", "CP06410"),
    "Dopunsko zdravstveno osiguranje": ("Dopunsko zdravstveno", "godišnja premija", "CP12120"),
    "Stomatološka usluga − čišćenje zubnoga kamenca, privatna praksa": ("Čišćenje zubnog kamenca", "privatni stomatolog", "CP06221"),
    "Četkica za zube": ("Četkica za zube", "1 komad", "CP13120"),
    "Pasta za zube, tuba": ("Pasta za zube", "tuba, 75 do 100 ml", "CP13120"),
    "Tekući sapun, s pumpicom": ("Tekući sapun", "s pumpicom, 250 do 300 ml", "CP13120"),
    "Krema za lice": ("Krema za lice", "50 ml", "CP13120"),
    "Šampon za kosu": ("Šampon", "250 do 350 ml", "CP13120"),
    "Gel za tuširanje": ("Gel za tuširanje", "250 do 350 ml", "CP13120"),
    "Špageti": ("Špageti u restoranu", "1 porcija", "CP11111"),
    "Juha": ("Juha u restoranu", "1 porcija", "CP11111"),
    "Bečki odrezak (s prilogom)": ("Bečki odrezak s prilogom", "restoran, 1 porcija", "CP11111"),
    "Voćni sok": ("Sok u kafiću", "2 dl", "CP11111"),
    "Kava, espresso": ("Espresso u kafiću", "1 šalica", "CP11111"),
    "Pizza, srednja": ("Pizza, srednja", "pizzerija", "CP11111"),
    "Muško šišanje, bez pranja kose": ("Muško šišanje", "bez pranja kose", "CP13131"),
    "Žensko šišanje, pranje kose i fen frizura": ("Žensko šišanje", "s pranjem i fen frizurom", "CP13131"),
    "Usluga pedikera": ("Pedikura", "1 tretman", "CP13132"),
    "Klasična masaža cijelog tijela": ("Masaža cijelog tijela", "1 sat", "CP13132"),
    "Kemijsko čišćenje hlača": ("Kemijsko čišćenje hlača", "1 par", "CP03141"),
    "Kemijsko čišćenje košulja": ("Kemijsko čišćenje košulje", "1 komad", "CP03141"),
    "Redovni godišnji servis plinskog bojlera": ("Servis plinskog bojlera", "redovni godišnji", "CP04320"),
    "Pranje automobila, strojno, izvana": ("Pranje automobila", "strojno, izvana", "CP07230"),
    "Ulaznica za kino": ("Ulaznica za kino", "1 ulaznica", "CP09610"),
    "Ulaznica za kazalište": ("Ulaznica za kazalište", "1 ulaznica", "CP09610"),
    "Teretana, mjesečna članarina": ("Teretana", "mjesečna članarina", "CP09462"),
    "Ulaznica za bazen": ("Ulaznica za bazen", "1 ulaznica", "CP09462"),
    "Tečaj stranog jezika, jedan semestar": ("Tečaj stranog jezika", "jedan semestar", "CP10509"),
    "Naknada za vođenje tekućeg računa": ("Vođenje tekućeg računa", "mjesečna naknada banke", "CP12220"),
}

# Neto plaće po županijama, euri: (godišnji prosjek 2022., prosjek I. do III. 2026.)
# Izvor: DZS, Zaposlenost i plaće, pregled po županijama (tab. 9.4.1.) i priopćenje RAD-2026-1-6/1.
PLACE = {
    "Zagrebačka": (971, 1557), "Krapinsko-zagorska": (890, 1490), "Sisačko-moslavačka": (871, 1420),
    "Karlovačka": (941, 1508), "Varaždinska": (865, 1424), "Koprivničko-križevačka": (899, 1414),
    "Bjelovarsko-bilogorska": (848, 1389), "Primorsko-goranska": (979, 1544), "Ličko-senjska": (918, 1394),
    "Virovitičko-podravska": (821, 1350), "Požeško-slavonska": (870, 1395), "Brodsko-posavska": (863, 1360),
    "Zadarska": (909, 1425), "Osječko-baranjska": (898, 1451), "Šibensko-kninska": (883, 1428),
    "Vukovarsko-srijemska": (842, 1378), "Splitsko-dalmatinska": (911, 1470), "Istarska": (963, 1421),
    "Dubrovačko-neretvanska": (927, 1424), "Međimurska": (870, 1410), "Grad Zagreb": (1149, 1769),
}
BRUTO_RH = (1370, 2146)  # prosječna bruto plaća RH: 2022. i I. do III. 2026.

# (id, naslov, priča, [4 DZS naziva], finale)
# finale: ("zup", ime županije) | ("bruto",) | ("dzs", DZS naziv)
RACUNI = [
    ("dorucak-2022", "Račun ispod magneta na hladnjaku", "Visio je na hladnjaku od zadnjeg kunskog Božića. Doručak za četvero, plaćen u kunama. Koliko bi taj doručak izašao danas?",
     ["Kruh od pšeničnog brašna, bijeli", "Maslac", "Džem", "Mlijeko, svježe"], ("zup", "Grad Zagreb")),
    ("pekara-2022", "Papirnata vrećica iz pekare", "U ruksaku je ostala vrećica iz pekare s računom na dnu. Masna mrlja je sačuvala svaku kunu.",
     ["Pecivo", "Krafna", "Kruh, miješani", "Jogurt, obični, čašica"], ("zup", "Splitsko-dalmatinska")),
    ("kafic-2022", "Račun pod tacnom", "Konobar ga je ostavio pod tacnom u prosincu 2022. i nitko ga nije uzeo. Zadnja runda plaćena u kunama.",
     ["Kava, espresso", "Voćni sok", "Pizza, srednja", "Špageti"], ("zup", "Primorsko-goranska")),
    ("smocnica-2022", "Popis iz bakine smočnice", "Baka je prije Božića 2022. napunila smočnicu i sve zapisala u bilježnicu. U kunama, naravno.",
     ["Pšenično brašno, bijelo", "Šećer, kristal", "Ulje, suncokretovo", "Bijela riža"], ("zup", "Osječko-baranjska")),
    ("rostilj-2022", "Račun za roštilj", "Netko je častio ekipu prije nego što je kuna otišla u povijest. Račun je preživio u pretincu auta.",
     ["Svinjetina s kostima, kotleti", "Svijetlo pivo, u boci", "Paprika", "Kruh od pšeničnog brašna, polubijeli"], ("zup", "Istarska")),
    ("frizer-2022", "Karton iz salona", "Na kartonu za bodove iz salona još pišu stare cijene. Zadnji pečat udaren je u prosincu 2022.",
     ["Muško šišanje, bez pranja kose", "Žensko šišanje, pranje kose i fen frizura", "Usluga pedikera", "Klasična masaža cijelog tijela"], ("zup", "Varaždinska")),
    ("voce-2022", "Vrećica s tržnice", "Na dnu platnene vrećice ostao je papirić s vage. Vitamini za zimu, plaćeni u kunama.",
     ["Limuni", "Naranče", "Banane", "Jabuke"], ("zup", "Dubrovačko-neretvanska")),
    ("narezak-2022", "Račun s delikatese", "Narezak za doček Nove godine 2023. Zadnji put da je teta na delikatesi rekla iznos u kunama.",
     ["Šunka u ovitku", "Posebna salama", "Mortadela", "Sir, polutrvrdi"], ("zup", "Zagrebačka")),
    ("kupaonica-2022", "Račun iz drogerije", "Zalijepio se za dno toaletne torbice. Sve za kupaonicu, kupljeno zadnjeg kunskog prosinca.",
     ["Šampon za kosu", "Gel za tuširanje", "Pasta za zube, tuba", "Četkica za zube"], ("zup", "Zadarska")),
    ("nedjelja-2022", "Račun za nedjeljni ručak", "Juha se kuha od ranog jutra, a račun iz mesnice stoji na kuhinjskom stolu od 2022.",
     ["Junetina s kostima", "Krumpiri", "Mrkva", "Kuhinjska sol"], ("zup", "Krapinsko-zagorska")),
    ("izlazak-2022", "Ulaznice iz džepa kaputa", "U kaputu za posebne prilike ostale su dvije ulaznice i račun iz restorana. Izlazak iz doba kune.",
     ["Bečki odrezak (s prilogom)", "Juha", "Ulaznica za kino", "Ulaznica za kazalište"], ("zup", "Karlovačka")),
    ("hladnjak-2022", "Račun iz kvartovskog dućana", "Skoknuo si samo po mlijeko i jaja. Račun je završio u ladici s baterijama i ostao tamo.",
     ["Mlijeko, trajno", "Kokošja jaja", "Margarin, stolni", "Sirni namaz, bez dodataka"], ("zup", "Sisačko-moslavačka")),
    ("povrce-2022", "Račun za lagani ručak", "Netko je u prosincu 2022. odlučio jesti zdravije. Odluka nije dugo trajala, ali račun jest.",
     ["Rajčice", "Tikvice", "Brokula", "Šampinjoni"], ("zup", "Šibensko-kninska")),
    ("riba-2022", "Račun za posni petak", "Petkom se jede riba. Ovaj račun iz 2022. čuva zadnju kunsku cijenu oslića.",
     ["Smrznuti oslić, file", "Sardine u ulju, bez dodataka", "Tuna u konzervi, bez dodataka", "Tjestenina"], ("zup", "Ličko-senjska")),
    ("grickalice-2022", "Račun za filmsku večer", "Grickalice za večer pred televizorom. Račun je ispao iz kutije s daljinskim upravljačima.",
     ["Čips, vrećica", "Mliječna čokolada bez dodataka", "Napolitanke", "Gazirani bezalkoholni napitak"], ("zup", "Međimurska")),
    ("zelje-2022", "Račun za zimski lonac", "Grah i zelje, pravi zimski ručak. Kuharica je račun spremila u knjigu recepata kao podsjetnik.",
     ["Slatko zelje", "Kelj", "Crveni luk", "Grah, suhi"], ("zup", "Koprivničko-križevačka")),
    ("pica-2022", "Račun za gajbu", "Piće za proslavu, kupljeno na veliko. Račun je preživio u gajbi u podrumu.",
     ["Mineralna gazirana voda, plastična boca", "Prirodna negazirana mineralna voda, plastična boca", "Prirodni voćni sok", "Voćni sirup"], ("zup", "Bjelovarsko-bilogorska")),
    ("ljekarna-2022", "Račun iz ljekarne", "Zima 2022., svi u kući kašlju. Račun iz ljekarne stoji u kutiji s lijekovima kojima je istekao rok.",
     ["Sirup za ublažavanje kašlja, za odrasle", "Tablete za snižavanje tjelesne temperature", "Krema za lice", "Tekući sapun, s pumpicom"], ("zup", "Brodsko-posavska")),
    ("kava-2022", "Račun za jutarnju kavu kod kuće", "Kava, čaj i nešto slatko uz to. Zadnja nabava prije nego što su se kune počele mijenjati u banci.",
     ["Kava, mljevena, s kofeinom", "Čaj, filter-vrećice, kutija", "Med, prirodni", "Kukuruzne pahuljice"], ("zup", "Vukovarsko-srijemska")),
    ("vecera-2022", "Račun za brzu večeru", "Kad se nikome ne kuha. Račun s benzinske pumpe, plaćen sitnišem u kunama.",
     ["Hrenovke, bez dodataka", "Pašteta", "Tost", "Majoneza, u vrećici"], ("zup", "Požeško-slavonska")),
    ("ciscenje-2022", "Listić iz kemijske čistionice", "Listić za preuzimanje odijela ostao je u pretincu. Uz njega i račun za veliko pospremanje.",
     ["Deterdžent za strojno pranje rublja, u prahu", "Tekući deterdžent za ručno pranje posuđa", "Kemijsko čišćenje hlača", "Kemijsko čišćenje košulja"], ("zup", "Virovitičko-podravska")),
    ("mesnica-2022", "Račun iz mesnice", "Mesar je račun zamotao zajedno s mesom. Papir je požutio, ali iznosi u kunama se još čitaju.",
     ["Pile", "Svinjetina bez kosti, but", "Teleća rebra", "Slanina"], ("bruto",)),
    ("zacini-2022", "Račun s police sa začinima", "Stajao je iza staklenki, na polici koju nitko ne briše. Sitnice bez kojih kuhinja ne radi.",
     ["Vegeta, obična", "Pšenična krupica (gris), obična", "Konzervirani krastavci", "Dječja instant hrana"], ("dzs", "Tečaj stranog jezika, jedan semestar")),
    ("usluge-2022", "Računi iz pretinca za rukavice", "Autopraonica, bazen, teretana i izvadak iz banke. Sve što se plaća, a ne stane u vrećicu.",
     ["Pranje automobila, strojno, izvana", "Ulaznica za bazen", "Teretana, mjesečna članarina", "Naknada za vođenje tekućeg računa"], ("dzs", "Redovni godišnji servis plinskog bojlera")),
    ("novcanik-2022", "Zgužvani računi iz novčanika", "Četiri papirića koja nemaju veze jedan s drugim, osim što su svi iz prosinca 2022. i svi u kunama.",
     ["Čajna kobasica", "Vino, bijelo", "Laboratorijske pretrage − kompletna krvna slika", "Stomatološka usluga − čišćenje zubnoga kamenca, privatna praksa"], ("dzs", "Dopunsko zdravstveno osiguranje")),
]

PO_NAZIVU = {r["ime"]: r for r in DZS}


def lijep_max(v):
    """Gornja granica klizača: oko 3 puta stara cijena, zaokruženo na okrugao broj."""
    cilj = v * 3.0
    red = 10 ** math.floor(math.log10(cilj))
    for m in (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if m * red >= cilj:
            return round(m * red, 2)
    return round(10 * red, 2)


def koraci(mx, cijeli):
    if cijeli:
        return (10, 5) if mx > 500 else (5, 1) if mx > 150 else (1, 1)
    if mx <= 3:
        return 0.02, 0.01
    if mx <= 10:
        return 0.05, 0.01
    if mx <= 40:
        return 0.1, 0.01
    return 0.5, 0.1


def procjena(dzs_naziv):
    r = PO_NAZIVU[dzs_naziv]
    ime, jedinica, skupina = STAVKE[dzs_naziv]
    i = IDX[skupina]
    danas = r["eur_pro23"] * i[ZADNJI] / i["2023-12"]
    cijeli = r["eur_pro22"] >= 60
    danas = round(danas) if cijeli else round(danas, 2)
    mx = lijep_max(max(r["eur_pro22"], danas / 1.6))
    k, f = koraci(mx, cijeli)
    return {"ime": ime, "jedinica": jedinica, "kn": r["kn_pro22"], "st": r["eur_pro22"], "c": danas,
            "max": mx, "k": k, "f": f, "cijeli": cijeli, "kat": r["kat"].capitalize()}


def ts_broj(x):
    return str(int(x)) if float(x).is_integer() else repr(round(x, 2))


def stavka_ts(s, opis, izv, rijec=None, procj=True):
    dijelovi = [
        f'kat: {json.dumps(s["kat"], ensure_ascii=False)}', f'ime: {json.dumps(s["ime"], ensure_ascii=False)}',
        f'opis: {json.dumps(opis, ensure_ascii=False)}', 'god: "2022."',
        f'kn: {"null" if s["kn"] is None else ts_broj(s["kn"])}', f'st: {ts_broj(s["st"])}', f'c: {ts_broj(s["c"])}',
        f'max: {ts_broj(s["max"])}', f'k: {ts_broj(s["k"])}', f'f: {ts_broj(s["f"])}',
    ]
    if s.get("cijeli"):
        dijelovi.append("cijeli: true")
    if procj:
        dijelovi.append("procjena: true")
    dijelovi.append(f'izv: "{izv}"')
    if rijec:
        dijelovi.append(f'rijec: {json.dumps(rijec, ensure_ascii=False)}')
    return "{ " + ", ".join(dijelovi) + " }"


def main():
    korisceno = []
    ukupno = IDX["TOTAL"][ZADNJI] / IDX["TOTAL"]["2022-12"] - 1
    mj, god = int(ZADNJI[5:]), ZADNJI[:4]
    redovi = []
    for rid, naslov, prica, nazivi, fin in RACUNI:
        assert len(nazivi) == 4, rid
        stavke = []
        for n in nazivi:
            korisceno.append(n)
            s = procjena(n)
            stavke.append(stavka_ts(s, f'{s["jedinica"]}, prosjek Hrvatske', "dzs"))
        if fin[0] == "zup":
            st, c = PLACE[fin[1]]
            f = {"kat": "Druga strana računa", "ime": f"Neto plaća: {fin[1]}", "kn": None, "st": st, "c": c, "max": 3000, "k": 10, "f": 5, "cijeli": True}
            finale = stavka_ts(f, "Prosječna mjesečna, 2022. cijela godina, 2026. siječanj do ožujak", "dzsplace", "Plaća u županiji", procj=False)
        elif fin[0] == "bruto":
            st, c = BRUTO_RH
            f = {"kat": "Druga strana računa", "ime": "Prosječna bruto plaća", "kn": None, "st": st, "c": c, "max": 4000, "k": 10, "f": 5, "cijeli": True}
            finale = stavka_ts(f, "Hrvatska, 2022. cijela godina, 2026. siječanj do ožujak", "dzsplace", "Bruto plaća", procj=False)
        else:
            korisceno.append(fin[1])
            s = procjena(fin[1])
            s["kat"] = "Druga strana računa"
            finale = stavka_ts(s, f'{s["jedinica"]}, prosjek Hrvatske', "dzs", s["ime"])
        redovi.append(
            "  {\n"
            f'    id: "{rid}",\n    naslov: {json.dumps(naslov, ensure_ascii=False)},\n    god: "prosinac 2022.",\n'
            f'    prica: {json.dumps(prica, ensure_ascii=False)},\n    sluzbena: SLUZBENA,\n    stavke: [\n      '
            + ",\n      ".join(stavke) + f",\n    ],\n    finale: {finale},\n  }}")

    # Svaka DZS stavka smije se upotrijebiti najviše jednom, i svaka mora postojati u izvoru.
    assert len(korisceno) == len(set(korisceno)), [n for n in korisceno if korisceno.count(n) > 1]
    neiskoristeno = sorted(set(PO_NAZIVU) - set(korisceno))
    assert set(korisceno) <= set(STAVKE), set(korisceno) - set(STAVKE)

    izlaz = (
        "// GENERIRANO: ne uređuj ručno. Izvor i metoda: scripts/sadrzaj/slozi.py\n"
        "// SAMO SERVER (sadrži današnje cijene).\n"
        'import type { Racun } from "./racuni";\n\n'
        f"const SLUZBENA = {{ p: {round(ukupno, 3)}, t: \"Službena inflacija, 12/2022. do {mj}/{god}. (Eurostat HICP)\" }};\n\n"
        "export const RACUNI_DZS: Racun[] = [\n" + ",\n".join(redovi) + ",\n];\n"
    )
    cilj = os.path.join(OVDJE, "..", "..", "src", "lib", "racuni-dzs.ts")
    open(cilj, "w", encoding="utf-8").write(izlaz)
    print(f"računa: {len(redovi)}, stavki iz DZS-a: {len(korisceno)}, neiskorišteno: {neiskoristeno}")
    print(f"službena inflacija 12/2022. do {mj}/{god}.: {ukupno:.3f}")


if __name__ == "__main__":
    main()
