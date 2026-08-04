# Module: Favorites

## Purpose

Allow users to save any supported entity for later.

This module must stay generic and reusable. It should not assume travel-specific entity types.

## Completion

Current completion: 65%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Add favorite | verified | 80% | User saves an approved provider through the real browser UI |
| Remove favorite | verified | 75% | User removes their own saved provider through the real browser UI and non-visible records return `404` |
| List favorites | verified | 75% | User sees the saved provider in the dashboard list |
| Prevent duplicates | verified | 70% | Repeated POST from the authenticated browser receives `409` and does not create a second record |
| Entity type registry | planned | 0% | Supported entity types are defined centrally |

## Required Data

- `favorites`

## Generic Entity Examples

- `organization`
- `content_post`
- Future module entity, such as `destination`, `course`, `product`, or `event`

## Verified Evidence

Verified on: 2026-08-04
Task: M3-001
Checks: `RUN_LIVE_BROWSER_AUTH=true npm run test:live:browser-shared-core` (desktop and mobile)
Result: pass
Notes: A temporary confirmed user saved, listed and removed an approved provider, then a repeated browser POST received `409`. Earlier RLS evidence proves a second user cannot read the record. Centralized entity-type registry acceptance remains.
