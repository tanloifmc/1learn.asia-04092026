-- Advisor remediations for the reusable core.
-- The existing event trigger is not exposed as an RPC capability, but revoking
-- EXECUTE removes the linter warning and preserves trigger execution.
-- revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Cover every core foreign key used by ownership, joins or operator workflows.
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
create index if not exists user_roles_created_by_idx on public.user_roles (created_by);
create index if not exists organizations_owner_id_idx on public.organizations (owner_id);
create index if not exists membership_subscriptions_organization_id_idx on public.membership_subscriptions (organization_id);
create index if not exists membership_subscriptions_plan_id_idx on public.membership_subscriptions (plan_id);
create index if not exists payment_intents_plan_id_idx on public.payment_intents (plan_id);
create index if not exists sepay_transactions_matched_payment_intent_id_idx on public.sepay_transactions (matched_payment_intent_id);
create index if not exists content_posts_category_id_idx on public.content_posts (category_id);
create index if not exists content_posts_author_id_idx on public.content_posts (author_id);
create index if not exists content_pages_author_id_idx on public.content_pages (author_id);
create index if not exists app_settings_updated_by_idx on public.app_settings (updated_by);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
