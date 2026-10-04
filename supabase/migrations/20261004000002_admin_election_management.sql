-- Phase 4: extend schema for admin election management + RLS policies

-- Widen election status set to match the existing app
alter table public.elections drop constraint if exists elections_status_check;
alter table public.elections add constraint elections_status_check
  check (status in ('draft', 'scheduled', 'active', 'closed', 'results_published', 'archived'));

alter table public.elections
  add column if not exists type text not null default 'custom',
  add column if not exists organization text not null default '',
  add column if not exists eligible_voters integer not null default 0,
  add column if not exists max_selections integer not null default 1,
  add column if not exists enable_nota boolean not null default false,
  add column if not exists published_results boolean not null default false,
  add column if not exists votes_cast integer not null default 0,
  add column if not exists total_positions integer not null default 0,
  add column if not exists total_candidates integer not null default 0;

alter table public.positions
  add column if not exists max_selections integer not null default 1;

alter table public.candidates
  add column if not exists election_id uuid references public.elections (id) on delete cascade,
  add column if not exists party text,
  add column if not exists department text,
  add column if not exists year text,
  add column if not exists biography text not null default '',
  add column if not exists manifesto text not null default '',
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  add column if not exists votes_received integer not null default 0;

-- backfill election_id from position
update public.candidates c
   set election_id = p.election_id
  from public.positions p
 where c.position_id = p.id
   and c.election_id is null;

create index if not exists candidates_election_idx on public.candidates (election_id);

-- RLS policies ----------------------------------------------
-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'admin'
  );
$$;

-- elections
drop policy if exists elections_select on public.elections;
create policy elections_select on public.elections
  for select using (auth.role() = 'authenticated');

drop policy if exists elections_admin_insert on public.elections;
create policy elections_admin_insert on public.elections
  for insert with check (public.is_admin());

drop policy if exists elections_admin_update on public.elections;
create policy elections_admin_update on public.elections
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists elections_admin_delete on public.elections;
create policy elections_admin_delete on public.elections
  for delete using (public.is_admin() and status = 'draft');

-- positions / candidates: readable by all authenticated, writable by admin
drop policy if exists positions_select on public.positions;
create policy positions_select on public.positions
  for select using (auth.role() = 'authenticated');
drop policy if exists positions_admin_write on public.positions;
create policy positions_admin_write on public.positions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists candidates_select on public.candidates;
create policy candidates_select on public.candidates
  for select using (auth.role() = 'authenticated');
drop policy if exists candidates_admin_write on public.candidates;
create policy candidates_admin_write on public.candidates
  for all using (public.is_admin()) with check (public.is_admin());

-- voter_eligibility & votes remain policy-less (added when voting is migrated)
