-- Phase 9 follow-up: audit log integrity
-- Only allow admins (or server-side code) to insert audit entries,
-- so non-admin clients cannot forge telemetry.
drop policy if exists audit_logs_auth_insert on public.audit_logs;
create policy audit_logs_admin_insert on public.audit_logs
  for insert with check (public.is_admin());
