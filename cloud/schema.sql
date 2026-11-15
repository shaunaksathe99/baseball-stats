-- Dugout Diary online accounts: run this once in Supabase (SQL Editor -> New query -> Run).
-- One row per signed-in parent/guardian. The row holds the whole diary as JSON and is readable only by its owner.

create table if not exists public.diaries (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint diaries_size check (pg_column_size(data) < 2000000)
);

alter table public.diaries enable row level security;

drop policy if exists "diaries select own" on public.diaries;
drop policy if exists "diaries insert own" on public.diaries;
drop policy if exists "diaries update own" on public.diaries;
drop policy if exists "diaries delete own" on public.diaries;
create policy "diaries select own" on public.diaries for select to authenticated using (auth.uid() = user_id);
create policy "diaries insert own" on public.diaries for insert to authenticated with check (auth.uid() = user_id);
create policy "diaries update own" on public.diaries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diaries delete own" on public.diaries for delete to authenticated using (auth.uid() = user_id);

-- The server stamps the time, so devices with wrong clocks cannot confuse syncing.
create or replace function public.diaries_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists diaries_touch on public.diaries;
create trigger diaries_touch before insert or update on public.diaries for each row execute function public.diaries_touch();

-- Lets a signed-in user delete their own account and diary from inside the app.
create or replace function public.delete_account() returns void language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- Nobody but signed-in users may touch the table.
revoke all on public.diaries from anon;
grant select, insert, update, delete on public.diaries to authenticated;
