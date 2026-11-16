-- Uz svaku igru sprema se oznaka računa po kojem je odigrana.
-- Bez toga bi dodavanje novog računa promijenilo raspored (dan -> račun) i stare igre
-- bi se prikazivale s cijenama drugog računa.
alter table public.igre add column racun text not null default '';
