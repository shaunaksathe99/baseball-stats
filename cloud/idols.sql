-- Plate 450 Diary: starter list of favorite players ("My Idol").
-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Only signed-in users can read it. Nobody can change it from the app: you edit it yourself in Table Editor.

create table if not exists public.idols (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 40),
  league text not null check (league in ('MLB', 'AUSL')),
  unique (name, league)
);

alter table public.idols enable row level security;
drop policy if exists "idols read signed in" on public.idols;
create policy "idols read signed in" on public.idols for select to authenticated using (true);

revoke all on public.idols from anon;
revoke all on public.idols from authenticated;
grant select on public.idols to authenticated;

-- A few starters. Add, rename or delete rows any time in Table Editor > idols.
insert into public.idols (name, league) values
  ('Aaron Judge', 'MLB'), ('Shohei Ohtani', 'MLB'), ('Mookie Betts', 'MLB'), ('Bobby Witt Jr.', 'MLB'),
  ('Juan Soto', 'MLB'), ('Paul Skenes', 'MLB'), ('Elly De La Cruz', 'MLB'), ('Gunnar Henderson', 'MLB'),
  ('Cal Raleigh', 'MLB'), ('Corbin Carroll', 'MLB'),
  ('Erin Coffel', 'AUSL'), ('Montana Fouts', 'AUSL'), ('Dejah Mulipola', 'AUSL'), ('Sis Bates', 'AUSL'),
  ('Tiare Jennings', 'AUSL'), ('Jessi Warren', 'AUSL')
on conflict do nothing;
