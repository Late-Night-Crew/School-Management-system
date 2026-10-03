# Demo Logins

These accounts are created by the demo seed (`./nsms seed`, run after `./nsms migrate`).
They are for local development and demos only. Never run the seed against a production database.

**Password for every account:** `Demo@2026`
(set a different one with `./nsms seed --password <password>`)

## Super admin

| Email | Can access |
| --- | --- |
| `admin@nsms.demo` | Everything under `/admin`: divisions, districts, schools, academic years, subjects, all students, all transfers, national reports |

If the database already had a super admin when you seeded, this account is skipped
(only one super admin is allowed) and the seed output says so.

## Regional admins

Read-only view of their own region's districts, schools, students, transfers and reports.

| Email | Region | Districts |
| --- | --- | --- |
| `northern.admin@nsms.demo` | Northern | Mzuzu, Karonga |
| `central.admin@nsms.demo` | Central | Lilongwe, Kasungu |
| `southern.admin@nsms.demo` | Southern | Blantyre, Zomba |

## School managers

Manage their own school: register students, enter marks, handle transfers, reports.

| Email | School number | School | District | Region |
| --- | --- | --- | --- | --- |
| `manager.demo-001@nsms.demo` | DEMO-001 | Blantyre Demo Community Day Secondary School | Blantyre | Southern |
| `manager.demo-002@nsms.demo` | DEMO-002 | Blantyre Demo Secondary School | Blantyre | Southern |
| `manager.demo-003@nsms.demo` | DEMO-003 | Karonga Demo Community Day Secondary School | Karonga | Northern |
| `manager.demo-004@nsms.demo` | DEMO-004 | Karonga Demo Secondary School | Karonga | Northern |
| `manager.demo-005@nsms.demo` | DEMO-005 | Kasungu Demo Community Day Secondary School | Kasungu | Central |
| `manager.demo-006@nsms.demo` | DEMO-006 | Kasungu Demo Secondary School | Kasungu | Central |
| `manager.demo-007@nsms.demo` | DEMO-007 | Lilongwe Demo Community Day Secondary School | Lilongwe | Central |
| `manager.demo-008@nsms.demo` | DEMO-008 | Lilongwe Demo Secondary School | Lilongwe | Central |
| `manager.demo-009@nsms.demo` | DEMO-009 | Mzuzu Demo Community Day Secondary School | Mzuzu | Northern |
| `manager.demo-010@nsms.demo` | DEMO-010 | Mzuzu Demo Secondary School | Mzuzu | Northern |
| `manager.demo-011@nsms.demo` | DEMO-011 | Zomba Demo Community Day Secondary School | Zomba | Southern |
| `manager.demo-012@nsms.demo` | DEMO-012 | Zomba Demo Secondary School | Zomba | Southern |

## What the demo data contains

- 12 students per school, 3 in each form (144 total); every 11th student has a recorded disability.
- Academic years 2025 (Completed), 2026 (Active) and 2027 (Upcoming).
- Marks for 2025 terms 1–3 (students now in Forms 2–4) and 2026 terms 1–2.
- 2025 JCE and MSCE pass rates for every school.
- One transfer in each status:

| Student | From | To | Status | Log in as |
| --- | --- | --- | --- | --- |
| DEMO-001-003 | DEMO-001 (Blantyre) | DEMO-002 (Blantyre) | Pending | `manager.demo-002` to approve or reject it |
| DEMO-007-004 | DEMO-007 (Lilongwe) | DEMO-009 (Mzuzu) | Pending, crosses regions | `manager.demo-009` to approve or reject it |
| DEMO-003-002 | DEMO-003 (Karonga) | DEMO-004 (Karonga) | Rejected | `manager.demo-003` to see the reason |
| DEMO-011-005 | DEMO-011 (Zomba) | DEMO-012 (Zomba) | Accepted | `manager.demo-011` to finalize it |
| DEMO-005-006 | DEMO-005 (Kasungu) | DEMO-010 (Mzuzu) | Completed | `manager.demo-010` to see the student now enrolled |

Students in accepted and completed transfers have already moved to the receiving school,
which is why DEMO-010 and DEMO-012 have 13 students and DEMO-005 and DEMO-011 have 11.

## Resetting the demo data

The seed refuses to run twice. To start over on a local database:

```sh
dropdb nsms && createdb nsms
./nsms migrate
./nsms seed
```
