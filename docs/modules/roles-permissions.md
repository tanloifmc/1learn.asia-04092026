# Module: Roles and Permissions

## Purpose

Define what each account type can see and do.

## Completion

Current completion: 50%

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
Notes: Two migrations are deployed to Supabase. All 16 core tables were queried and confirmed with RLS enabled; Supabase security advisors returned no issues after remediation. Cross-user authenticated RLS tests and trusted-admin seeding remain.
