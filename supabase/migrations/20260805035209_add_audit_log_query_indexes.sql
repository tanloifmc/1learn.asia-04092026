create index if not exists audit_logs_created_at_id_idx
  on public.audit_logs (created_at desc, id desc);

create index if not exists audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at desc, id desc);

create index if not exists audit_logs_entity_type_created_at_idx
  on public.audit_logs (entity_type, created_at desc, id desc);
