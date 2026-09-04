---
description: Implement a Phase 0 task for 1learn.asia following the multi-agent SDLC defined in AGENTS.md and .agents/agents/. Includes DB, Backend, Frontend, QA, Security, and Release gate.
argument-hint: "<task description from 13_ROADMAP.md>"
---

# 1learn.asia Phase 0 Task Implementation

## Context
This is the 1learn.asia platform — a Vietnamese AI-powered career guidance platform for high school students.

## MANDATORY READING BEFORE WORK
Read the following files FIRST before writing any code:
1. `AGENTS.md` — Agent hierarchy, Quality Gate, Retry Protocol (MANDATORY)
2. `docs/13_ROADMAP.md` — Current task status. Only work on tasks marked `[ ]` in Phase 0.
3. `docs/02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md` — Feature spec & acceptance criteria.
4. `docs/04_DATABASE_SPECIFICATION.md` — Check if table is defined here BEFORE creating migration.
5. `docs/product-bible.md` — Product philosophy and constraints.
6. `.agents/agents/` — Read the agent files relevant to your task.

## Task
$ARGUMENTS

## Implementation Steps (follow AGENTS.md Quality Gate strictly)

### Step 1: Product Architect Review
- Confirm the task is in SRS and Phase 0 Roadmap.
- Confirm any needed DB tables are in `04_DATABASE_SPECIFICATION.md`. If not, add spec first.
- No code until architect sign-off.

### Step 2: Database Engineer (if DB changes needed)
- Create SQL migration file in `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`.
- ALWAYS enable RLS on new tables.
- Use naming conventions from `04_DATABASE_SPECIFICATION.md`.

### Step 3: Backend Engineer
- Create Server Actions in `src/features/<domain>/actions/`.
- Validate ALL inputs with Zod.
- Mark files with `"use server";` directive.
- Never expose raw DB errors to client.

### Step 4: Frontend Engineer
- Build components in `src/features/<domain>/components/`.
- Mobile-first (375px base). No emoji. Loading + Error + Empty states required.
- Use CSS variables for colors.

### Step 5: QA Engineer
- Write Playwright E2E tests in `tests/e2e/live-<feature>.spec.ts`.
- Test: happy path, error state, permission denied, mobile (375px), desktop (1280px).
- Use Supabase admin client to create/delete test users (follow pattern in `tests/e2e/live-account.spec.ts`).
- Use env guard: `const enabled = process.env.RUN_LIVE_BROWSER_AUTH === "true";`

### Step 6: Security Reviewer
- Review RLS policies — student cannot see other student's data.
- Review server actions — no secrets in response.
- Output Security Findings report.

### Step 7: Release Manager
- Run: `npm run typecheck` and `npm run lint` — must be zero errors.
- Verify QA passed and Security has no Critical/High findings.
- Update `docs/13_ROADMAP.md` — mark task as `[x]`.
- Update `docs/04_DATABASE_SPECIFICATION.md` if DB changed.

## Definition of Done
- [ ] UX complete (happy path + error + empty + loading states)
- [ ] RLS on all new tables
- [ ] Server-side validation for all inputs
- [ ] Mobile responsive (tested at 375px)
- [ ] Playwright E2E test written
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `docs/13_ROADMAP.md` updated (task → [x])
