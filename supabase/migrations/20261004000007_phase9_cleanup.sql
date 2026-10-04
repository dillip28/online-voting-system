-- Phase 9: complete migration to Supabase as the source of truth

-- Extend profiles so admin voter management no longer needs localStorage
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add column if not exists phone text,
  add column if not exists student_id text,
  add column if not exists department text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists two_factor_enabled boolean not null default false,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

-- AUDIT LOGS ------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  user_name   text not null,
  user_role   text not null,
  action      text not null,
  resource    text not null,
  resource_id text not null,
  details     text,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource, resource_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select using (public.is_admin());

drop policy if exists audit_logs_auth_insert on public.audit_logs;
create policy audit_logs_auth_insert on public.audit_logs
  for insert with check (auth.role() = 'authenticated');

-- SYSTEM SETTINGS --------------------------------------------------------------
create table if not exists public.system_settings (
  id          integer primary key default 1 check (id = 1),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.system_settings enable row level security;

drop policy if exists system_settings_read on public.system_settings;
create policy system_settings_read on public.system_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists system_settings_admin_write on public.system_settings;
create policy system_settings_admin_write on public.system_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- NOTIFICATIONS ----------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text not null default 'system',
  is_read     boolean not null default false,
  election_id uuid,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications
  for insert with check (public.is_admin());
