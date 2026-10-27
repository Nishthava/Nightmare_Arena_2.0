create table if not exists public.bgmi_leaderboard (
  id integer primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.bgmi_leaderboard enable row level security;

revoke all on public.bgmi_leaderboard from anon, authenticated;
grant select on public.bgmi_leaderboard to anon, authenticated;
grant insert, update on public.bgmi_leaderboard to authenticated;

drop policy if exists "Anyone can read the BGMI leaderboard"
  on public.bgmi_leaderboard;
create policy "Anyone can read the BGMI leaderboard"
  on public.bgmi_leaderboard
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated admins can publish the BGMI leaderboard"
  on public.bgmi_leaderboard;
create policy "Authenticated admins can publish the BGMI leaderboard"
  on public.bgmi_leaderboard
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can update the BGMI leaderboard"
  on public.bgmi_leaderboard;
create policy "Authenticated admins can update the BGMI leaderboard"
  on public.bgmi_leaderboard
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
