# qa: MVP end-to-end checklist by role

**Goal:** One checklist of everything the MVP lets each type of user do, written as
"As a ___, I can ___". Tick an item only after doing it end to end in the browser against a
freshly seeded database. If an item fails, open a bug and link it next to the item.

Anything not on this list is out of scope for the MVP (see the end of this issue).

## Setup

```sh
# backend/
dropdb nsms && createdb nsms
./nsms migrate
./nsms seed            # demo data + logins, password Demo@2026
./nsms server

# repo root
npm run dev
```

Demo logins are listed in `docs/demo-logins.md`. The accounts used below:

| Role | Login | Scope |
| --- | --- | --- |
| Super admin | `admin@nsms.demo` | Whole country |
| Regional admin | `northern.admin@nsms.demo` | Northern division (Mzuzu, Karonga) |
| School manager | `manager.demo-009@nsms.demo` | Mzuzu Demo Community Day Secondary School (DEMO-009) |
| School manager (2nd school) | `manager.demo-010@nsms.demo` | Mzuzu Demo Secondary School (DEMO-010) |

---

## Everyone

- [ ] **As any user, I can sign in** with my email and password and land on my own home page (super admin → Admin Dashboard, regional admin → Regional Dashboard, school manager → School Dashboard).
- [ ] **As any user, I see a clear error** for a wrong password or an invalid email, and stay on the login page.
- [ ] **As any user, I can sign out** from the sidebar and am returned to the login page; using the browser Back button does not show protected pages.
- [ ] **As any user, my session ends when my token expires** (6 hours): the next action sends me to the login page.
- [ ] **As any user, I only see the sidebar links for my role**, and every link opens a working page.
- [ ] **As any user, I cannot open another role's pages by typing the URL** (e.g. a school manager visiting `/#/admin/dashboard` or another school's `/#/school/10/dashboard` is sent back to their own home page).
- [ ] **As any user, I see a loading state, an error with "Try again", or an empty state** instead of a blank page when data is loading, unavailable or empty.

## Super admin (Ministry)

**Dashboard**
- [ ] As a super admin, I can see national totals: students (with disability count), schools, divisions and districts, pending transfers, and the active academic year.
- [ ] As a super admin, I can see students, schools and pending transfers per division, and jump to the full report.

**Divisions, districts and schools**
- [ ] As a super admin, I can add, rename and delete a division, and search the list.
- [ ] As a super admin, I can add, edit and delete a district within a division, and search and page through districts.
- [ ] As a super admin, I can add, edit and delete a school (name, school number, district), choosing the district after the division.
- [ ] As a super admin, I see the backend's error message when a change is rejected (e.g. a duplicate name), not a generic failure or a false success.

**Academic years and subjects**
- [ ] As a super admin, I can create an academic year with a year, start and end dates and a status (Upcoming, Active or Completed).
- [ ] As a super admin, I can edit an academic year (e.g. make it Active) and delete one.
- [ ] As a super admin, I cannot save an academic year whose end date is before its start date.
- [ ] As a super admin, I can add, edit and delete subjects (code, name, description) and search them.

**Students**
- [ ] As a super admin, I can see every student nationally and filter by division, district and school, search by name or number, and page through results.
- [ ] As a super admin, I can add a student to any school for an active academic year.
- [ ] As a super admin, I can edit a student, and their subjects and guardian details are kept.
- [ ] As a super admin, I can delete a student after confirming.
- [ ] As a super admin, I can export the filtered student list to Excel.

**Transfers**
- [ ] As a super admin, I can create a transfer for a student; their current school is filled in as the sending school.
- [ ] As a super admin, I cannot create a transfer to the same school, for a student who is not at the sending school, or for a student who already has a pending transfer.
- [ ] As a super admin, I can pick any school and see its incoming and outgoing transfers with student and school names.
- [ ] As a super admin, I can approve a pending transfer, and the student moves to the receiving school.
- [ ] As a super admin, I can reject a pending transfer with a reason (a reason is required).
- [ ] As a super admin, I can finalize an accepted transfer, which marks it Completed.

**Reports**
- [ ] As a super admin, I can see a per-school report (students by gender and disability, transfers in and out, pending, JCE/MSCE pass rates) with totals.
- [ ] As a super admin, I can filter the report by division, district and pass-rate academic year.
- [ ] As a super admin, I can export the report to Excel and PDF, and print it.

## Regional admin

Regional admins have read-only access to their own division.

- [ ] As a regional admin, I can see my division's districts, schools, students (with gender and disability) and pending transfers on my dashboard.
- [ ] As a regional admin, I can see the school and student count for each district and jump to that district's schools or students.
- [ ] As a regional admin, I can see every school in my division with enrolment and transfer figures, filter by district and search; the district filter is kept in the page link.
- [ ] As a regional admin, I can see every student in my division, filter by district and school, search, page through them, and export the list to Excel.
- [ ] As a regional admin, I can see every transfer into or out of my division's schools, including from other divisions, and filter by status and search.
- [ ] As a regional admin, I can see the school report for my division only, filtered by district and pass-rate year, and export it to Excel/PDF or print it.
- [ ] As a regional admin, I can see my account and division details on Settings.
- [ ] As a regional admin, I cannot see another division's data, change any data, or open admin or school pages.

## School manager

**Dashboard and academic years**
- [ ] As a school manager, I can see my school's name, enrolment (by gender and disability), transfer counts, the active academic year and the latest exam pass rates.
- [ ] As a school manager, I can see my latest incoming and outgoing transfers and a gender chart, and reach common tasks from Quick Actions.
- [ ] As a school manager, I can view the national academic years and which one is active, but not change them.

**Students**
- [ ] As a school manager, I can register a student with personal details, form, guardian details, disability information and subjects; this is only allowed while an academic year is active.
- [ ] As a school manager, I can edit a registered student (including from the Students page's edit button) and delete one after confirming.
- [ ] As a school manager, I can see my students, search them, and open a student's details with their marks for each year and term.
- [ ] As a school manager, I only ever see my own school's students.

**Marks**
- [ ] As a school manager, I can choose an academic year, a term (1–3) and a form, and enter a mark from 0 to 100 for each student in each subject they take.
- [ ] As a school manager, I cannot enter a mark for a subject the student does not take.
- [ ] As a school manager, I can see grades (A–F) and each student's average update as I type, with unsaved cells highlighted.
- [ ] As a school manager, I can save all changed marks at once or one student's row at a time, and clearing a mark removes it.
- [ ] As a school manager, I am warned before switching year, term or form with unsaved marks.
- [ ] As a school manager, I can see a summary for the form: marks entered, average, highest, lowest, pass rate and per-subject averages.

**Transfers**
- [ ] As a school manager, I can see all my students in a table (search and page through them) and start a transfer from a student's row; students with a pending transfer are marked and cannot be transferred again.
- [ ] As a school manager, I choose the destination by picking a division first, then a school in that division (grouped by district, never my own school), and submit with a date (defaults to today) and reason.
- [ ] As a school manager receiving a transfer, I can approve it (the student joins my school) or reject it with a reason.
- [ ] As a school manager sending a transfer, I can finalize it once the receiving school has accepted it.
- [ ] As a school manager, I can see my outgoing transfers with their status and any rejection reason, and filter by status.
- [ ] As a school manager, I cannot approve or reject my own outgoing transfer, or finalize an incoming one.

**Reports**
- [ ] As a school manager, I can see a marks report for a chosen year and term (or all years/terms cumulatively) and form, with each student's subject averages, overall average, grade, position and subjects passed.
- [ ] As a school manager, I can see a per-subject summary (students, average, pass rate) and export the marks report to Excel or PDF.
- [ ] As a school manager, I can record and update my school's JCE and MSCE pass rates for an academic year, and see them on my dashboard and in the national and regional reports.
- [ ] As a school manager, I can see my account and school details on Settings.

## End-to-end journeys

Run these across roles, in order, on a fresh seed:

- [ ] **Set up a year:** the super admin creates academic year 2027 (Upcoming), adds a subject, and adds a school; the new school appears for the Northern regional admin and in reports.
- [ ] **Register and mark:** `manager.demo-009` registers a student, enters their Term 1 marks, and sees them in the student's details and the marks report.
- [ ] **Transfer:** `manager.demo-009` requests a transfer of a student to DEMO-010 → `manager.demo-010` approves it and sees the student in their list → `manager.demo-009` finalizes it → `northern.admin` sees it as Completed and the super admin's report shows the new counts.
- [ ] **Reject:** a second transfer request is rejected with a reason, and the sending school sees the reason.
- [ ] **Pass rates:** `manager.demo-009` records 2026 pass rates, and they appear in the super admin and Northern regional reports for 2026.

## Out of scope for the MVP

- Notifications (each role's Notifications page shows a placeholder).
- Creating or managing user accounts in the UI (logins come from the seed).
- Password reset, password change, sign-up and OTP.
- Regional admins approving transfers or editing data.
- Attendance, timetables, fees and other modules not listed above.
- Server-side paging for very large student lists.
