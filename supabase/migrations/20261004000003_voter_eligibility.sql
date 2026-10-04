-- Phase 5: voter eligibility + RLS for voter_eligibility and votes

-- Tighten elections visibility: voters cannot see drafts
drop policy if exists elections_select on public.elections;
create policy elections_select on public.elections
  for select using (
    public.is_admin()
    or status <> 'draft'
  );

-- voter_eligibility policies -------------------------------------------------
drop policy if exists voter_eligibility_select_own on public.voter_eligibility;
create policy voter_eligibility_select_own on public.voter_eligibility
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists voter_eligibility_admin_write on public.voter_eligibility;
create policy voter_eligibility_admin_write on public.voter_eligibility
  for all using (public.is_admin()) with check (public.is_admin());

-- votes policies ---------------------------------------------------------------
drop policy if exists votes_select_own on public.votes;
create policy votes_select_own on public.votes
  for select using (auth.uid() = voter_id or public.is_admin());

-- A voter may only insert their own vote, and only when eligible;
-- one vote per position is enforced by UNIQUE(election_id, position_id, voter_id).
drop policy if exists votes_voter_insert on public.votes;
create policy votes_voter_insert on public.votes
  for insert with check (
    auth.uid() = voter_id
    and exists (
      select 1 from public.voter_eligibility ve
       where ve.election_id = votes.election_id
         and ve.user_id = auth.uid()
         and ve.eligible = true
    )
  );

-- no UPDATE/DELETE on votes for non-admins (ballots are immutable)

-- Auto-grant eligibility for existing voters and elections --------------------
insert into public.voter_eligibility (election_id, user_id, eligible)
select e.id, p.id, true
  from public.elections e
  cross join public.profiles p
 where p.role = 'voter'
on conflict (election_id, user_id) do nothing;

-- Auto-create eligibility row whenever a voter profile or election is created
create or replace function public.grant_eligibility_on_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role = 'voter' then
    insert into public.voter_eligibility (election_id, user_id, eligible)
    select e.id, new.id, true from public.elections e
    on conflict (election_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_grant_eligibility on public.profiles;
create trigger profiles_grant_eligibility
  after insert on public.profiles
  for each row execute function public.grant_eligibility_on_new_profile();

create or replace function public.grant_eligibility_on_new_election()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.voter_eligibility (election_id, user_id, eligible)
  select new.id, p.id, true from public.profiles p
   where p.role = 'voter'
  on conflict (election_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists elections_grant_eligibility on public.elections;
create trigger elections_grant_eligibility
  after insert on public.elections
  for each row execute function public.grant_eligibility_on_new_election();
