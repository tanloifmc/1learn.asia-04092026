# CHANGELOG
All significant changes to 1learn.asia are documented here.
Format: `[Date] [Type] Description`
Types: `[SETUP]` `[FEATURE]` `[FIX]` `[DOCS]` `[INFRA]` `[SECURITY]`

---

## 2026-08-25

### [SETUP] Project Management System Initialized
- Created `docs/00_PRODUCT_VISION.md` — Product vision and north star metric
- Created `docs/product-bible.md` — Single Source of Truth for all product decisions
- Created `docs/02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md` — Full SRS with feature specs
- Created `docs/04_DATABASE_SPECIFICATION.md` — All domain table definitions
- Created `docs/06_AI_AND_MATCHING_SPECIFICATION.md` — Matching algorithms and AI guardrails
- Created `docs/13_ROADMAP.md` — Full project roadmap with task breakdown to Phase 10
- Created `docs/14_DECISION_LOG.md` — 7 initial architectural decisions recorded

### [SETUP] Multi-Agent System Initialized
- Created `.agents/agents/orchestrator/agent.md`
- Created `.agents/agents/product-architect/agent.md`
- Created `.agents/agents/backend-engineer/agent.md`
- Created `.agents/agents/frontend-engineer/agent.md`
- Created `.agents/agents/database-engineer/agent.md`
- Created `.agents/agents/ai-matching-engineer/agent.md`
- Created `.agents/agents/qa-engineer/agent.md`
- Created `.agents/agents/security-reviewer/agent.md`
- Created `.agents/agents/release-manager/agent.md`

### [SETUP] AGENTS.md Updated
- Added AI Agent Operating System rules
- Added Quality Gate, Retry Protocol, Branch Strategy
- Added global rules and DoD checklist

### [INFRA] Core Platform (inherited from starter kit)
- Next.js + TypeScript scaffold: verified
- Supabase Auth + 12 migrations deployed
- GitHub CI Quality Gate: passing
- Vercel preview: 66 routes built
- Playwright E2E suite: passing

---

*Mọi thay đổi quan trọng phải được thêm vào đây.*
