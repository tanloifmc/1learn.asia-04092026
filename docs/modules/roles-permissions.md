# Module: Roles and Permissions

## Purpose

Define what each account type can see and do.

## Completion

Current completion: 80%

## Roles

| Role | Description |
| --- | --- |
| `user` | Standard authenticated user |
| `provider` | User who owns or manages a provider organization |
| `editor` | Internal content manager |
| `admin` | Internal application operator |
| `super_admin` | Full owner-level administrator |

## Permission Matrix

| Capability | User | Provider | Editor | Admin | Super admin |
| --- | --- | --- | --- | --- | --- |
| Manage own profile | Yes | Yes | Yes | Yes | Yes |
| View own notifications | Yes | Yes | Yes | Yes | Yes |
| Manage own favorites | Yes | Yes | Yes | Yes | Yes |
| Create inquiry | Yes | Yes | Yes | Yes | Yes |
| Manage own provider profile | No | Yes | No | Yes | Yes |
| View provider inquiries | No | Own org only | No | All | All |
| Manage CMS content | No | No | Yes | Yes | Yes |
| Publish CMS content | No | No | Yes | Yes | Yes |
| Manage users | No | No | No | Yes | Yes |
| Change roles | No | No | No | Limited | Yes |
| Manage billing plans | No | No | No | Yes | Yes |
| Manage app settings | No | No | No | Yes | Yes |
| View audit logs | No | No | No | Yes | Yes |

## Required Tests

- User cannot access provider admin pages without provider role.
- Provider cannot access another provider's private data.
- Editor cannot manage roles or billing plans.
- Admin can moderate providers and content.
- Super admin can manage all roles.

## Verified Evidence

Verified on: 2026-08-03
Task: M2-001 and M2-003
Checks: migration authored, direct TypeScript check, direct ESLint check, Next.js production build
Result: partial pass
Notes: All six migrations are deployed to Supabase. Security advisors returned no issues after remediation. On 2026-08-04, the gated live check verified standard-user profile and role isolation, then granted a temporary administrator role and verified managed-profile visibility before deleting both test users. Provider/editor and route-level role acceptance remain.

Verified on: 2026-08-05
Task: M2-003
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-roles`
Result: pass (4/4 desktop/mobile)
Notes: A normal Admin did not see an Admin-grant button and received `403` when directly requesting the API escalation. A Super Admin granted then revoked Admin via the user-management UI; the target session gained and lost `/admin/users` access immediately. Super Admin grants are intentionally not available through the UI.

Verified on: 2026-08-05
Task: M2-003
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-roles`
Result: pass (4/4 desktop/mobile)
Notes: The generic administrative role API now permits only internal `editor` and, for Super Admin, `admin` changes. Direct Provider-role grants returned `403` for both Admin and Super Admin; provider access continues to be assigned only by the provider-organization workflow.
