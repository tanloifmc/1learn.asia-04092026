# 1learn.asia — Project Documentation

## Đọc theo thứ tự này (bắt buộc)

| # | File | Mục đích | Đọc khi nào |
|---|---|---|---|
| 1 | `00_PRODUCT_VISION.md` | Tại sao sản phẩm tồn tại | Luôn luôn đọc trước |
| 2 | `product-bible.md` | SSoT cho mọi quyết định sản phẩm | Luôn luôn đọc trước |
| 3 | `01_PRODUCT_REQUIREMENTS.md` | Business model, freemium, assessment frameworks, data sources | Trước khi code feature mới |
| 4 | `02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md` | Spec chi tiết từng feature | Trước khi code bất kỳ feature nào |
| 5 | `04_DATABASE_SPECIFICATION.md` | Schema tất cả domain tables | Trước khi tạo migration |
| 6 | `06_AI_AND_MATCHING_SPECIFICATION.md` | Thuật toán matching + AI guardrails | Trước khi implement engine |
| 7 | `13_ROADMAP.md` | Tiến độ hiện tại + task breakdown | Mỗi phiên làm việc |
| 8 | `14_DECISION_LOG.md` | Lý do các quyết định đã được đưa ra | Khi cần hiểu context |

## Core Platform Documentation (kế thừa từ starter kit)

| # | File | Mục đích |
|---|---|---|
| `00-system-overview.md` | Tổng quan hệ thống core | 
| `01-feature-registry.md` | Registry tính năng core |
| `02-module-completion-tracker.md` | Tiến độ core modules |
| `03-data-contracts.md` | Schema core tables |
| `04-api-contracts.md` | API contracts core |
| `05-development-rules.md` | Coding rules |
| `06-project-board.md` | Project board core |
| `07-source-architecture.md` | Cấu trúc source code |
| `08-infrastructure-integrations.md` | Supabase, Vercel, Resend, GitHub |
| `09-acceptance-playbook.md` | Acceptance test patterns |
| `modules/` | Chi tiết từng core module |

## Agent System

All agent definitions: `.agents/agents/`

| Agent | File | Role |
|---|---|---|
| Orchestrator | `.agents/agents/orchestrator/agent.md` | Điều phối tất cả agents |
| Product Architect | `.agents/agents/product-architect/agent.md` | Bảo vệ Product Bible |
| Backend Engineer | `.agents/agents/backend-engineer/agent.md` | API + business logic |
| Frontend Engineer | `.agents/agents/frontend-engineer/agent.md` | UI + components |
| Database Engineer | `.agents/agents/database-engineer/agent.md` | Migrations + RLS |
| AI Matching Engineer | `.agents/agents/ai-matching-engineer/agent.md` | Matching engine + AI |
| QA Engineer | `.agents/agents/qa-engineer/agent.md` | Tests + bug reports |
| Security Reviewer | `.agents/agents/security-reviewer/agent.md` | Security + privacy |
| Release Manager | `.agents/agents/release-manager/agent.md` | Deployment control |

## Documentation Rules

1. Mọi table mới phải được define trong `04_DATABASE_SPECIFICATION.md` TRƯỚC khi tạo migration.
2. Mọi feature mới phải có spec trong `02_SOFTWARE_REQUIREMENTS_SPECIFICATION.md` TRƯỚC khi code.
3. Khi hoàn thành một task → update `13_ROADMAP.md` (mark `[x]`).
4. Mọi quyết định kiến trúc lớn → thêm vào `14_DECISION_LOG.md`.
5. Code và documentation không được mâu thuẫn — nếu mâu thuẫn, task chưa hoàn thành.

## Quick Status Check

Xem tiến độ hiện tại: [`13_ROADMAP.md`](./13_ROADMAP.md)

Xem task đang làm: Tìm `[/]` trong `13_ROADMAP.md`

Xem quyết định đã đưa ra: [`14_DECISION_LOG.md`](./14_DECISION_LOG.md)
