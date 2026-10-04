-- Phase 7: results and analytics computed in the database

-- Aggregated votes per election (no voter identities exposed)
create or replace view public.election_vote_counts
with (security_invoker = true) as
  select election_id, count(*)::int as total_votes
    from public.votes
   group by election_id;

-- Aggregated votes per position per candidate (no voter identities)
create or replace view public.position_candidate_counts
with (security_invoker = true) as
  select election_id, position_id, candidate_id, count(*)::int as votes
    from public.votes
   group by election_id, position_id, candidate_id;

-- Distinct voters per election
create or replace view public.election_participation
with (security_invoker = true) as
  select election_id, count(distinct voter_id)::int as participating_voters
    from public.votes
   group by election_id;

-- Election results RPC: deterministic aggregation, safe for the browser
create or replace function public.get_election_results(p_election_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_election public.elections%rowtype;
  v_total int;
  v_positions jsonb;
begin
  select * into v_election from public.elections where id = p_election_id;
  if not found then
    raise exception 'Election not found';
  end if;

  -- only closed/published results, unless the caller is an admin
  if v_election.status not in ('closed', 'results_published', 'archived') then
    if not public.is_admin() then
      raise exception 'Results are not available for this election';
    end if;
  end if;

  select coalesce(sum(total_votes), 0)::int into v_total
    from public.election_vote_counts
   where election_id = p_election_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'positionId', p.id,
      'positionTitle', p.name,
      'positionDescription', p.description,
      'totalVotes', coalesce((
        select sum(c.votes) from public.position_candidate_counts c
         where c.position_id = p.id
      ), 0),
      'notaVotes', 0,
      'candidates', coalesce((
        select jsonb_agg(jsonb_build_object(
          'candidateId', c.id,
          'name', c.name,
          'photoUrl', c.photo_url,
          'party', c.party,
          'votes', c.votes,
          'percentage', case when c.t > 0
            then round((c.votes::numeric / c.t) * 100, 2)
            else 0 end,
          'rank', c.rank,
          'isWinner', c.rank = 1 and c.votes > 0
        ) order by c.votes desc, c.name asc)
        from (
          select c.id, c.name, c.photo_url, c.party,
                 coalesce(v.votes, 0) as votes,
                 pos_total.t,
                 row_number() over (order by coalesce(v.votes, 0) desc, c.name asc) as rank
            from public.candidates c
            left join public.position_candidate_counts v
              on v.candidate_id = c.id and v.position_id = p.id
            cross join lateral (
              select coalesce(sum(x.votes), 0) as t
                from public.position_candidate_counts x
               where x.position_id = p.id
            ) pos_total
           where c.position_id = p.id and c.election_id = p_election_id
        ) c
      ), '[]'::jsonb)
    ) order by p.display_order
  ), '[]'::jsonb)
    into v_positions
    from public.positions p
   where p.election_id = p_election_id;

  return jsonb_build_object(
    'electionId', v_election.id,
    'electionTitle', v_election.title,
    'electionStatus', v_election.status,
    'totalEligibleVoters', v_election.eligible_voters,
    'totalVotesCast', v_total,
    'turnoutPercentage', case when v_election.eligible_voters > 0
      then round((v_total::numeric / v_election.eligible_voters) * 100, 2)
      else 0 end,
    'positions', v_positions
  );
end;
$$;

revoke all on function public.get_election_results(uuid) from public;
grant execute on function public.get_election_results(uuid) to authenticated;
