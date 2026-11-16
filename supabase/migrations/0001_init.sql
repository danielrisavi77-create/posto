-- Pošto? početna shema.
-- Sav pristup ide preko servera (service role). RLS je uključen bez politika,
-- pa anon i authenticated ključevi ne mogu čitati ni pisati ništa.

create table public.igraci (
  id uuid primary key,
  nadimak text not null default '' check (char_length(nadimak) <= 16),
  zupanija text not null check (char_length(zupanija) between 1 and 40),
  stvoren timestamptz not null default now()
);

create table public.igre (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique check (kod ~ '^[a-z0-9]{8}$'),
  dan integer not null check (dan >= 1),
  sezona text not null check (sezona ~ '^\d{4}-\d{2}$'),
  igrac_id uuid not null references public.igraci(id) on delete cascade,
  nadimak text not null default '' check (char_length(nadimak) <= 16),
  zupanija text not null,
  pogodci numeric[] not null default '{}',
  bodovi integer[] not null default '{}',
  ukupno integer not null default 0,
  gotovo boolean not null default false,
  protivnik_id uuid references public.igre(id) on delete set null,
  protivnik_bot jsonb,
  stvoreno timestamptz not null default now(),
  zavrseno timestamptz,
  unique (dan, igrac_id)
);

create index igre_dan_gotovo_idx on public.igre (dan, gotovo, zupanija);
create index igre_igrac_sezona_idx on public.igre (igrac_id, sezona);
create index igre_sezona_idx on public.igre (sezona, gotovo, zupanija);

alter table public.igraci enable row level security;
alter table public.igre enable row level security;

-- Atomarno dodavanje pogotka: prolazi samo ako je p_indeks točno sljedeći po redu,
-- pa dvostruki klik ili dva taba ne mogu upisati istu rundu dvaput.
create function public.dodaj_pogodak(
  p_igra uuid, p_indeks integer, p_vrijednost numeric, p_bodovi integer, p_zadnji boolean
) returns setof public.igre
language sql
security invoker
set search_path = ''
as $$
  update public.igre
     set pogodci = pogodci || p_vrijednost,
         bodovi = bodovi || p_bodovi,
         ukupno = ukupno + p_bodovi,
         gotovo = p_zadnji,
         zavrseno = case when p_zadnji then now() else null end
   where id = p_igra
     and cardinality(pogodci) = p_indeks
     and not gotovo
  returning *;
$$;

-- Nasumičan stvarni protivnik: netko iz druge županije tko je današnji račun već završio.
-- order by random() je u redu do nekoliko desetaka tisuća igara dnevno; iznad toga zamijeniti uzorkovanjem.
create function public.nasumicni_protivnik(p_dan integer, p_zupanija text, p_igrac uuid)
returns setof public.igre
language sql
security invoker
set search_path = ''
as $$
  select *
    from public.igre
   where dan = p_dan and gotovo and zupanija <> p_zupanija and igrac_id <> p_igrac
   order by random()
   limit 1;
$$;

create view public.liga_sezona with (security_invoker = true) as
  select sezona, zupanija, round(avg(ukupno))::integer as prosjek, count(*)::integer as igara
    from public.igre
   where gotovo
   group by sezona, zupanija;

create view public.liga_dan with (security_invoker = true) as
  select dan, zupanija, round(avg(ukupno))::integer as prosjek, count(*)::integer as igara
    from public.igre
   where gotovo
   group by dan, zupanija;

revoke all on public.igraci, public.igre, public.liga_sezona, public.liga_dan from anon, authenticated;
revoke execute on function public.dodaj_pogodak(uuid, integer, numeric, integer, boolean) from public, anon, authenticated;
revoke execute on function public.nasumicni_protivnik(integer, text, uuid) from public, anon, authenticated;
grant execute on function public.dodaj_pogodak(uuid, integer, numeric, integer, boolean) to service_role;
grant execute on function public.nasumicni_protivnik(integer, text, uuid) to service_role;
