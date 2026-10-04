-- Phase 6: atomic, validated ballot submission via RPC

create or replace function public.submit_ballot(
  p_election_id uuid,
  p_selections jsonb
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_election public.elections%rowtype;
  v_selection jsonb;
  v_position_id uuid;
  v_candidate_id uuid;
  v_seen_positions uuid[] := '{}';
  v_confirmation text;
begin
  -- 1. authenticated
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  -- 2. election exists, is published and active, within its time window
  select * into v_election from public.elections where id = p_election_id;
  if not found then
    raise exception 'Election not found';
  end if;
  if v_election.status <> 'active' then
    raise exception 'Election is not active (status: %)', v_election.status;
  end if;
  if v_election.start_time is not null and now() < v_election.start_time then
    raise exception 'Election has not started';
  end if;
  if v_election.end_time is not null and now() > v_election.end_time then
    raise exception 'Election has ended';
  end if;

  -- 3. voter eligibility
  if not exists (
    select 1 from public.voter_eligibility ve
     where ve.election_id = p_election_id
       and ve.user_id = v_user
       and ve.eligible = true
  ) then
    raise exception 'Not eligible to vote in this election';
  end if;

  -- 4. no prior ballot (has_voted flag + actual votes)
  if exists (select 1 from public.votes v where v.election_id = p_election_id and v.voter_id = v_user) then
    raise exception 'You have already voted in this election';
  end if;
  if exists (
    select 1 from public.voter_eligibility ve
     where ve.election_id = p_election_id and ve.user_id = v_user and ve.has_voted = true
  ) then
    raise exception 'You have already voted in this election';
  end if;

  -- 5. validate payload shape
  if p_selections is null or jsonb_typeof(p_selections) <> 'array' or jsonb_array_length(p_selections) = 0 then
    raise exception 'No selections provided';
  end if;

  -- 6. validate each selection, insert atomically (whole function is one transaction)
  for v_selection in select * from jsonb_array_elements(p_selections)
  loop
    v_position_id := nullif(v_selection ->> 'position_id', '')::uuid;
    v_candidate_id := nullif(v_selection ->> 'candidate_id', '')::uuid;

    if v_position_id is null or v_candidate_id is null then
      raise exception 'Each selection requires position_id and candidate_id';
    end if;

    if v_position_id = any(v_seen_positions) then
      raise exception 'Duplicate selection for position %', v_position_id;
    end if;
    v_seen_positions := v_seen_positions || v_position_id;

    -- position must belong to this election
    if not exists (
      select 1 from public.positions p
       where p.id = v_position_id and p.election_id = p_election_id
    ) then
      raise exception 'Position % does not belong to this election', v_position_id;
    end if;

    -- candidate must belong to that position, be approved, and be in this election
    if not exists (
      select 1 from public.candidates c
       where c.id = v_candidate_id
         and c.position_id = v_position_id
         and c.election_id = p_election_id
         and c.status = 'approved'
    ) then
      raise exception 'Candidate % is not approved for position %', v_candidate_id, v_position_id;
    end if;

    insert into public.votes (election_id, position_id, candidate_id, voter_id)
    values (p_election_id, v_position_id, v_candidate_id, v_user);
  end loop;

  -- has_voted is maintained by the votes_sync_has_voted trigger
  v_confirmation := 'VS-' || to_char(now(), 'YYYY') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

  return jsonb_build_object(
    'success', true,
    'confirmation_id', v_confirmation,
    'voted_at', now()
  );
end;
$$;

revoke all on function public.submit_ballot(uuid, jsonb) from public;
grant execute on function public.submit_ballot(uuid, jsonb) to authenticated;
