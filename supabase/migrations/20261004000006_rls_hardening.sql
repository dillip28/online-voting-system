-- Phase 8: comprehensive RLS hardening

-- helper: is the current user an admin (security definer avoids RLS recursion)
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

-- helper: is the current user an eligible voter for this election?
create or replace function public.is_eligible_voter(p_election_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.voter_eligibility ve
     where ve.election_id = p_election_id
       and ve.user_id = auth.uid()
       and ve.eligible = true
  );
$$;

-- PROFILES -------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_admin_select on public.profiles;
-- (covered by profiles_select_own; removed)

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id and role = 'voter');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- block privilege escalation via role change (admins excepted)
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'You are not allowed to change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ELECTIONS ------------------------------------------------------------------
drop policy if exists elections_select on public.elections;
create policy elections_select on public.elections
  for select using (public.is_admin() or public.is_eligible_voter(id));

drop policy if exists elections_admin_insert on public.elections;
create policy elections_admin_insert on public.elections
  for insert with check (public.is_admin());

drop policy if exists elections_admin_update on public.elections;
create policy elections_admin_update on public.elections
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists elections_admin_delete on public.elections;
create policy elections_admin_delete on public.elections
  for delete using (public.is_admin() and status = 'draft');

-- POSITIONS ------------------------------------------------------------------
drop policy if exists positions_select on public.positions;
create policy positions_select on public.positions
  for select using (
    public.is_admin()
    or public.is_eligible_voter(election_id)
  );

drop policy if exists positions_admin_write on public.positions;
create policy positions_admin_write_insert on public.positions
  for insert with check (public.is_admin());
create policy positions_admin_write_update on public.positions
  for update using (public.is_admin()) with check (public.is_admin());
create policy positions_admin_write_delete on public.positions
  for delete using (public.is_admin());

-- CANDIDATES -----------------------------------------------------------------
drop policy if exists candidates_select on public.candidates;
create policy candidates_select on public.candidates
  for select using (
    public.is_admin()
    or public.is_eligible_voter(election_id)
  );

drop policy if exists candidates_admin_write on public.candidates;
create policy candidates_admin_write_insert on public.candidates
  for insert with check (public.is_admin());
create policy candidates_admin_write_update on public.candidates
  for update using (public.is_admin()) with check (public.is_admin());
create policy candidates_admin_write_delete on public.candidates
  for delete using (public.is_admin());

-- VOTER ELIGIBILITY ----------------------------------------------------------
drop policy if exists voter_eligibility_select_own on public.voter_eligibility;
create policy voter_eligibility_select_own on public.voter_eligibility
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists voter_eligibility_admin_write on public.voter_eligibility;
create policy voter_eligibility_admin_insert on public.voter_eligibility
  for insert with check (public.is_admin());
create policy voter_eligibility_admin_update on public.voter_eligibility
  for update using (public.is_admin()) with check (public.is_admin());
create policy voter_eligibility_admin_delete on public.voter_eligibility
  for delete using (public.is_admin());

-- VOTES ----------------------------------------------------------------------
-- Ballots are immutable; direct client INSERT is removed entirely.
-- All submissions go through public.submit_ballot(...) (security definer RPC),
-- which performs its own server-side validation.
drop policy if exists votes_voter_insert on public.votes;

drop policy if exists votes_select_own on public.votes;
create policy votes_select_own on public.votes
  for select using (auth.uid() = voter_id or public.is_admin());

-- No UPDATE/DELETE policies for anyone: ballots cannot be modified or removed
-- through the API. (Service role, used by server tooling only, bypasses RLS.)
