-- Privatne lige (ekipa, obitelj, ured) i ljestvica igrača.

create table public.lige (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique check (kod ~ '^[a-z0-9]{6}$'),
  naziv text not null check (char_length(naziv) between 2 and 30),
  vlasnik uuid not null references public.igraci(id) on delete cascade,
  stvorena timestamptz not null default now()
);

create table public.lige_clanovi (
  liga_id uuid not null references public.lige(id) on delete cascade,
  igrac_id uuid not null references public.igraci(id) on delete cascade,
  pristupio timestamptz not null default now(),
  primary key (liga_id, igrac_id)
);

create index lige_clanovi_igrac_idx on public.lige_clanovi (igrac_id);
create index igre_dan_ukupno_idx on public.igre (dan, ukupno desc) where gotovo;
create index igre_igrac_idx on public.igre (igrac_id) where gotovo;

alter table public.lige enable row level security;
alter table public.lige_clanovi enable row level security;

-- Zbroj bodova po igraču u sezoni. Nadimak i županija su zadnje spremljeni u tablici igrača.
create view public.ljestvica_sezona with (security_invoker = true) as
  select g.sezona, g.igrac_id, i.nadimak, i.zupanija,
         sum(g.ukupno)::integer as bodovi, count(*)::integer as igara
    from public.igre g
    join public.igraci i on i.id = g.igrac_id
   where g.gotovo
   group by g.sezona, g.igrac_id, i.nadimak, i.zupanija;

revoke all on public.lige, public.lige_clanovi, public.ljestvica_sezona from anon, authenticated;
