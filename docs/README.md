# Application Core Platform Documentation

This folder is the single source of truth for the application core.

Any developer or AI agent working on this codebase must read these files before adding or changing features:

1. `00-system-overview.md`
2. `01-feature-registry.md`
3. `02-module-completion-tracker.md`
4. `03-data-contracts.md`
5. `04-api-contracts.md`
6. `05-development-rules.md`
7. `06-project-board.md`
8. `07-source-architecture.md`
9. `08-infrastructure-integrations.md`
10. `09-acceptance-playbook.md`
11. The relevant file in `modules/`

The goal of this project is to create a reusable application core that can be copied into future products. Domain-specific features, such as travel planning, marketplace listings, education content, or booking workflows, must be implemented as modules on top of this core.

## Current Build Status

No production code has been implemented yet. The project is currently in the planning and architecture phase.

| Area | Status | Completion |
| --- | --- | --- |
| Documentation foundation | In progress | 75% |
| Application code | Not started | 0% |
| Database schema | Planned only | 0% |
| API routes | Planned only | 0% |
| Automated tests | Not started | 0% |

## Documentation Rules

- Every module must have a matching file in `docs/modules/`.
- Every implemented feature must be listed in `01-feature-registry.md`.
- Every module completion percentage must be updated in `02-module-completion-tracker.md`.
- Database tables, columns, enums, indexes, and policies must be documented in `03-data-contracts.md`.
- API routes, request payloads, response payloads, auth requirements, and side effects must be documented in `04-api-contracts.md`.
- If code and documentation disagree, the task is not complete.
- The project board is updated at the start and end of every implementation task.
- Completion can move to `100%` only after the acceptance playbook has recorded evidence.
