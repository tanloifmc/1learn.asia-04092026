# Module: Favorites

## Purpose

Allow users to save any supported entity for later.

This module must stay generic and reusable. It should not assume travel-specific entity types.

## Completion

Current completion: 25%

## Feature Checklist

| Feature | Status | Completion | Acceptance criteria |
| --- | --- | --- | --- |
| Add favorite | implemented | 25% | User can save a supported entity |
| Remove favorite | implemented | 25% | User can remove their own favorite |
| List favorites | implemented | 25% | User can see saved items |
| Prevent duplicates | implemented | 25% | Same entity cannot be saved twice by same user |
| Entity type registry | planned | 0% | Supported entity types are defined centrally |

## Required Data

- `favorites`

## Generic Entity Examples

- `organization`
- `content_post`
- Future module entity, such as `destination`, `course`, `product`, or `event`

## Verified Evidence

Verified on: 2026-08-03
Task: M3-001
Checks: direct TypeScript check, direct ESLint check, Next.js production build
Result: partial pass
Notes: Generic entity-type/entity-id API and list UI are implemented. Two-account RLS acceptance remains for CORE-1.
