# Production Security Matrix

This matrix defines the expected access controls across different actors, resources, and actions in the 1learn.asia platform. It serves as the baseline for all Security and Privacy Audits.

**Success Criteria for Rejection:** Unauthorized actor receives zero unauthorized data and cannot mutate protected state.

## 1. Student Privacy & Data Ownership

| Actor | Resource | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| Student A | Own Profile (`users` / `students`) | Read | ALLOW |
| Student A | Own Profile | Update | ALLOW |
| Student A | Student B Profile | Read / Update | DENY |
| Student A | Own Assessment Results | Read | ALLOW |
| Student A | Student B Assessment Results | Read | DENY |
| Student A | Own Saved Careers / Roadmaps | Read / Write | ALLOW |
| Student A | Student B Saved Careers / Roadmaps | Read / Write | DENY |
| Student A | Own Goals & Action Plans | Read / Write | ALLOW |
| Student A | Student B Goals & Action Plans | Read / Write | DENY |

## 2. Parent-Child Privacy Boundaries

| Actor | Resource | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| Parent A | Own Profile | Read / Update | ALLOW |
| Parent A | Linked Child (Student A) Profile | Read allowed fields | ALLOW |
| Parent A | Unlinked Child (Student B) Profile | Read | DENY |
| Parent A | Linked Child Assessment (Private scope) | Read | DENY (unless granted by student) |
| Parent A | Linked Child Roadmaps | Read | ALLOW |
| Parent A | Linked Child Roadmaps / Goals | Mutate | DENY (View-only by default) |
| Student A | Parent Permission Settings | Mutate | ALLOW |
| Parent A | Parent Permission Settings | Mutate | DENY (Only student can grant) |

## 3. Privilege Escalation & IDOR

| Actor | Resource | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| Student A | Admin Actions / Dashboard | Execute / Read | DENY |
| Parent A | Student Write Actions (e.g., save career) | Execute | DENY |
| Any User | `role` field in auth or profile | Update to 'admin' | DENY |
| Student A | API Route `?id=StudentB` | Read / Execute | DENY |
| Anonymous | Any Protected API / RPC | Execute | DENY |

## 4. Token & Invitation Security

| Actor | Resource | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| Parent / Student | Invitation Token | Redeem | ALLOW (if valid & unexpired) |
| Parent / Student | Expired Token | Redeem | DENY |
| Parent / Student | Already Used Token (Replay) | Redeem | DENY |
| Attacker | Concurrent Redemptions of Same Token | Redeem | DENY (Only 1 succeeds) |
| Attacker | Random / Invalid Token (Brute Force) | Redeem | DENY |

## 5. System & Service Roles

| Actor | Resource | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| Service Role / DB Trigger | Audit Logs (`analytics_events`) | Write | ALLOW |
| Public / Anonymous | Analytics Events | Write | ALLOW (Append-only) |
| Public / Anonymous | Leads | Write | ALLOW (Append-only) |
| Public / Anonymous | Sensitive SYSTEM Tables | Read / Write | DENY |

> **Note on Audits:** All security audits must be tested using **hostile inputs** (e.g., intentionally manipulating UUIDs, replaying tokens, concurrent requests, overriding roles), rather than just following the "happy path" UI flows.
