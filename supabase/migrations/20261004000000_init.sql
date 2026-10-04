-- VoteSecure Phase 2: initial database schema
-- Target: Supabase Postgres (auth.users managed by Supabase Auth)

create extension if not exists pgcrypto;

-- PROFILES ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'voter' check (role in ('admin', 'voter')),
  name        text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- ELECTIONS ------------------------------------------------------------
create table if not exists public.elections (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  start_time  timestamptz,
  end_time    timestamptz,
  created_by  uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);

create index if not exists elections_status_idx on public.elections (status);
create index if not exists elections_created_by_idx on public.elections (created_by);

-- POSITIONS ------------------------------------------------------------
create table if not exists public.positions (
  id            uuid primary key default gen_random_uuid(),
  election_id   uuid not null references public.elections (id) on delete cascade,
  name          text not null,
  description   text,
  display_order integer not null default 0,
  -- composite uniqueness lets votes reference (id, election_id),
  -- guaranteeing a position belongs to the stated election
  unique (id, election_id)
);

create index if not exists positions_election_idx on public.positions (election_id);

-- CANDIDATES -----------------------------------------------------------
create table if not exists public.candidates (
  id          uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions (id) on delete cascade,
  name        text not null,
  description text,
  photo_url   text,
  approved    boolean not null default false,
  created_at  timestamptz not null default now(),
  -- composite uniqueness lets votes reference (id, position_id),
  -- guaranteeing a candidate belongs to the stated position
  unique (id, position_id)
);

create index if not exists candidates_position_idx on public.candidates (position_id);

-- VOTER ELIGIBILITY ------------------------------------------------------
create table if not exists public.voter_eligibility (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  eligible    boolean not null default true,
  has_voted   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (election_id, user_id)
);

create index if not exists voter_eligibility_user_idx on public.voter_eligibility (user_id);

-- VOTES ----------------------------------------------------------------
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null,
  position_id uuid not null,
  candidate_id uuid not null,
  voter_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- SECURITY: at most one vote per voter per position in an election,
  -- enforced by the database, not the frontend
  unique (election_id, position_id, voter_id),

  -- fall back to simple FKs plus composite FKs below
  foreign key (election_id) references public.elections (id) on delete cascade,
  foreign key (position_id, election_id) references public.positions (id, election_id) on delete cascade,
  foreign key (candidate_id, position_id) references public.candidates (id, position_id) on delete cascade
);

create index if not exists votes_election_idx on public.votes (election_id);
create index if not exists votes_voter_idx on public.votes (voter_id);
create index if not exists votes_position_idx on public.votes (position_id);
create index if not exists votes_candidate_idx on public.votes (candidate_id);

-- updated_at maintenance for elections
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists elections_set_updated_at on public.elections;
create trigger elections_set_updated_at
  before update on public.elections
  for each row execute function public.set_updated_at();

-- mark voter_eligibility.has_voted on vote insert (and clear on delete)
create or replace function public.sync_eligibility_has_voted()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.voter_eligibility
       set has_voted = true
     where election_id = new.election_id
       and user_id = new.voter_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.voter_eligibility ve
       set has_voted = exists (
         select 1 from public.votes v
          where v.election_id = old.election_id
            and v.voter_id = old.voter_id
       )
     where ve.election_id = old.election_id
       and ve.user_id = old.voter_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists votes_sync_has_voted on public.votes;
create trigger votes_sync_has_voted
  after insert or delete on public.votes
  for each row execute function public.sync_eligibility_has_voted();

-- Row Level Security: enabled now; policies to be defined in Phase 3
alter table public.profiles enable row level security;
alter table public.elections enable row level security;
alter table public.positions enable row level security;
alter table public.candidates enable row level security;
alter table public.voter_eligibility enable row level security;
alter table public.votes enable row level security;
