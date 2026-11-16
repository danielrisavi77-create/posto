-- Ograničenje broja zahtjeva po mreži (IP se sprema samo kao sažetak sa solju, nikad u izvornom obliku).

create table public.ogranicenja (
  kljuc text not null,
  prozor timestamptz not null,
  broj integer not null default 0,
  primary key (kljuc, prozor)
);

alter table public.ogranicenja enable row level security;

-- Vraća true ako je zahtjev unutar granice. Brojač je po fiksnom vremenskom prozoru.
create function public.dopusti(p_kljuc text, p_limit integer, p_sekundi integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_prozor timestamptz := to_timestamp(floor(extract(epoch from now()) / p_sekundi) * p_sekundi);
  v_broj integer;
begin
  insert into public.ogranicenja (kljuc, prozor, broj) values (p_kljuc, v_prozor, 1)
  on conflict (kljuc, prozor) do update set broj = public.ogranicenja.broj + 1
  returning broj into v_broj;

  -- Povremeno čišćenje: zapisi stariji od jednog dana više ne trebaju.
  if random() < 0.01 then
    delete from public.ogranicenja where prozor < now() - interval '1 day';
  end if;

  return v_broj <= p_limit;
end;
$$;

revoke all on public.ogranicenja from anon, authenticated;
revoke execute on function public.dopusti(text, integer, integer) from public, anon, authenticated;
grant execute on function public.dopusti(text, integer, integer) to service_role;
