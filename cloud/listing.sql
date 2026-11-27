-- Plate 450 Diary directory listing requests: run this once in Supabase (SQL Editor -> New query -> Run).
-- The listing-request function keeps a one-way hash of each visitor's IP here, only to limit how many requests one
-- visitor can send. No names, emails or request text are stored. Rows older than two days are deleted automatically.
-- Row-level security is on with no policies, so the site's public key cannot read or write this table; only the function can.
create table if not exists public.listing_rate (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists listing_rate_ip_at on public.listing_rate (ip_hash, at);
create index if not exists listing_rate_at on public.listing_rate (at);
alter table public.listing_rate enable row level security;
