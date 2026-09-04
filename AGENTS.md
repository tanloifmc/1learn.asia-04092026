# AGENTS.md — 1learn.asia AI Agent Operating System
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 1learn.asia — AI Agent Operating System

## MANDATORY READING ORDER

Before ANY agent does ANY work, read in order:

1. `docs/00_PRODUCT_VISION.md` — Why this product exists
2. `docs/product-bible.md` — Single Source of Truth for product decisions
3. `docs/02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md` — What to build
4. `docs/04_DATABASE_SPECIFICATION.md` — How data is structured
5. `docs/06_AI_AND_MATCHING_SPECIFICATION.md` — AI/Matching algorithms
6. `docs/13_ROADMAP.md` — Current progress and task breakdown
7. `docs/14_DECISION_LOG.md` — Why past decisions were made
8. `docs/README.md` — Core platform documentation rules

---

## Agent Hierarchy

```
                    PRODUCT OWNER (Human)
                           │
                           ▼
                    ORCHESTRATOR AGENT (Main)
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        PLANNER        ARCHITECT        RESEARCHER
           │
           ▼
      TASK EXECUTION
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
   FE     BE     DB
    └──────┼──────┘
           ▼
      AI-MATCHING
           ▼
          QA
           ▼
       SECURITY
           ▼
      CODE-REVIEW
           ▼
        RELEASE
```

---

## Quality Gate (bắt buộc cho mọi feature)

```
REQUIREMENTS DEFINED IN SRS
        ↓
TASK PLANNED & APPROVED
        ↓
DATABASE SCHEMA APPROVED (nếu có migration)
        ↓
IMPLEMENTATION COMPLETE
        ↓
UNIT/INTEGRATION TEST PASS
        ↓
E2E TEST PASS (Playwright)
        ↓
SECURITY REVIEW PASS
        ↓
CODE REVIEW PASS
        ↓
DEFINITION OF DONE CHECKLIST PASS
        ↓
ROADMAP.md UPDATED (task → [x])
        ↓
MERGE TO DEVELOP
```

**Không được skip bất kỳ gate nào.**

---

## Retry Protocol

```
MAX_RETRIES = 3 per task stage

Attempt 1: Normal execution
Attempt 2: Fix với context bổ sung
Attempt 3: Fix với constraints chặt hơn
After 3 fails: STOP → escalate to Orchestrator → report to Product Owner
```

---

## Branch Strategy

```
main          — Production only. Never commit directly.
develop       — Integration branch. Merge via PR only.
feature/[id]-[name]  — Feature branches từ develop
fix/[id]-[name]      — Bug fixes từ develop
```

**Agents không được push trực tiếp lên main.**
**Mọi code phải qua develop → PR → review → merge.**

---

## Global Rules (áp dụng cho MỌI agent)

### ALWAYS DO:
- Đọc Product Bible trước khi làm bất kỳ việc gì
- Check xem table đã được define trong `docs/04_DATABASE_SPECIFICATION.md` trước khi tạo migration
- Check xem feature đã có spec trong `docs/02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md` trước khi code
- Update `docs/13_ROADMAP.md` khi task hoàn thành (mark `[x]`)
- Report files changed và lý do sau mỗi task
- Write mobile-first CSS
- Add RLS to every new table

### NEVER DO:
- Fabricate data (university info, salary, scores)
- Hard-code data that belongs in database
- Modify deployed migrations (create new ones instead)
- Import domain modules from core modules
- Push directly to main
- Skip the Quality Gate
- Self-approve own code review
- Refactor unrelated code while fixing a bug
- Assume a feature is "obvious" without reading its SRS spec
- **NEVER LEAVE `// TODO` COMMENTS OR MOCK VARIABLES (`let score = 0; // mocked`) IN CODE. WE ARE LAUNCHING TO PRODUCTION. COMPUTE IT OR STOP AND ASK.**
- **NO MOCKING DATABASE IN TESTS:** Always run tests against a real database instance (Local or Cloud Dev) using real seed data. Do not use `vi.mock()` to fake database responses for core engines.

---

## Data-Driven Development (Seed First)

Để chấm dứt nợ kỹ thuật và hardcode:
1. Khi bắt đầu một Phase mới có logic tính toán (Engine/Matching), **bắt buộc viết và chạy file Seed Data thật trước khi code logic**.
2. Seed Data có thể đẩy thẳng lên **Supabase Cloud (Dev Environment)** vì chúng ta có thể dễ dàng truncate/reset.
3. Dữ liệu seed phải chứa các trường hợp phức tạp (edge cases). Việc khuyết thiếu dữ liệu của các Phase tương lai trong Seed là điều **bắt buộc phải có**, nhằm ép code phải viết cơ chế phòng ngự (Defensive Programming: `if (!data) return 'insufficient'`) thay vì âm thầm gán số ảo.

---

## Definition of Done (DoD) — Checklist

- [ ] UX complete (happy path + error + empty + loading states)
- [ ] Database schema matches `04_DATABASE_SPECIFICATION.md`
- [ ] RLS policies on all new tables
- [ ] Server-side validation for all inputs
- [ ] Client-side validation for all inputs
- [ ] Mobile responsive (tested at 375px)
- [ ] Permissions enforced (server-side, not just UI)
- [ ] **NO HARDCODED VALUES, NO MOCK DATA, NO `// TODO` LEFT IN CODE (Must run audit search before submitting)**
- [ ] No mock data remaining
- [ ] Playwright E2E test written and passing
- [ ] `docs/13_ROADMAP.md` updated (task → [x])
- [ ] `docs/04_DATABASE_SPECIFICATION.md` updated (if DB changed)
- [ ] `docs/02_SRS.md` updated (if spec changed)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Production build passes

---

## Task Handoff Format

When handing off between agents, include:

```markdown
## Task Handoff

**Task ID:** [TASK-XXX]
**From Agent:** [agent name]
**To Agent:** [agent name]
**Status:** [completed / needs_review / blocked]

### What was done:
- [list of changes]

### Files changed:
- `path/to/file` — reason

### What the next agent needs to do:
- [specific instructions]

### Open questions:
- [anything needing decision]

### Test results:
- [pass/fail summary]
```

---

*This file is the operating system for all AI agents on this project.*
*If any agent's behavior conflicts with these rules, the rules take precedence.*
