-- Igra bez obrasca: prva stavka se igra odmah, županija se bira nakon prvog odgovora.
-- Zato igrač i igra nakratko smiju postojati bez županije (prazan niz).
alter table public.igraci drop constraint igraci_zupanija_check;
alter table public.igraci add constraint igraci_zupanija_check check (char_length(zupanija) <= 40);

-- Dupla: jednom po računu igrač može riskirati jednu stavku (dvostruki bodovi ili nula).
alter table public.igre add column dupla smallint;

drop function public.dodaj_pogodak(uuid, integer, numeric, integer, boolean);

create function public.dodaj_pogodak(
  p_igra uuid, p_indeks integer, p_vrijednost numeric, p_bodovi integer, p_zadnji boolean, p_dupla boolean default false
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
         zavrseno = case when p_zadnji then now() else null end,
         dupla = case when p_dupla then p_indeks else dupla end
   where id = p_igra
     and cardinality(pogodci) = p_indeks
     and not gotovo
     and (not p_dupla or dupla is null)
  returning *;
$$;

revoke execute on function public.dodaj_pogodak(uuid, integer, numeric, integer, boolean, boolean) from public, anon, authenticated;
grant execute on function public.dodaj_pogodak(uuid, integer, numeric, integer, boolean, boolean) to service_role;

-- Lige županija ne broje igre bez županije.
create or replace view public.liga_sezona with (security_invoker = true) as
  select sezona, zupanija, round(avg(ukupno))::integer as prosjek, count(*)::integer as igara
    from public.igre
   where gotovo and zupanija <> ''
   group by sezona, zupanija;

create or replace view public.liga_dan with (security_invoker = true) as
  select dan, zupanija, round(avg(ukupno))::integer as prosjek, count(*)::integer as igara
    from public.igre
   where gotovo and zupanija <> ''
   group by dan, zupanija;
