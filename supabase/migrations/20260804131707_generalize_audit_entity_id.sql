alter table public.audit_logs
  alter column entity_id type text using entity_id::text;
