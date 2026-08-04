# Module: CMS and App Settings

## Purpose

Let admins manage public-facing content and application configuration without code changes.

## Completion

Current completion: 75%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Homepage content settings | implemented | 45% | Typed admin form and server-rendered public home content pass production build; live editor acceptance remains |
| Static pages | implemented | 70% | Protected create/publish manager and public published-page rendering pass live desktop/mobile acceptance; privacy/terms render from code fallbacks until CMS overrides exist |
| Blog categories | implemented | 65% | Protected category creation passes live desktop/mobile acceptance; filtering/editing remains |
| Blog posts | verified | 82% | Editor upload auto-fills post cover URL; published post and cover image render publicly on desktop/mobile |
| SEO metadata | implemented | 50% | Post/page author controls and public route metadata, including default legal page metadata, pass production build; SEO review remains |
| Branding settings | implemented | 55% | Typed admin form, server validation, audit logging and shared-layout consumption pass production build |
| Header menu | implemented | 55% | Typed admin form, internal-link validation and shared-header consumption pass production build |
| Footer menu | implemented | 55% | Typed admin form, internal-link validation and shared-footer consumption pass production build |
| Social links | implemented | 50% | Typed admin form, external URL validation and shared-footer consumption pass production build |

## Required Data

- `content_categories`
- `content_posts`
- `app_settings`
- `audit_logs`

## Verification Evidence

On 2026-08-04, TypeScript, ESLint and the Next.js production build passed with the CMS/settings routes, typed branding/navigation/social forms, key-specific server validation and settings audit logging. `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-cms` passed 6/6 desktop/mobile: an editor uploaded a cover image that auto-filled the post form, published the post and public image, created a category and static page, saved an isolated public setting and verified its `setting.updated` event in the admin audit console. Migrations `20260804130400_split_public_content_policies.sql` and `20260804131707_generalize_audit_entity_id.sql` are deployed to Supabase; they restore anon public-content access and make audit entity IDs reusable for UUID and text keys. Edit/archive and runtime branding/navigation acceptance remain.
