# Frontend v18 Migration Plan

**ALL 19 ORIGINAL PHASES COMPLETE (2026-10-08); PHASES 20-23 PLANNED
(2026-10-08).** New backend work landed after Phase 19 closed (org
join-request self-serve flow, a public settings endpoint, and a venue-
schedule embed) — phases 20-23 consume it and are scoped but **not yet
implemented**. See `plan.md`'s top section for the compiled list of
outstanding follow-ups (three of the original six are now resolved by the
new backend work; the rest are unrelated backend-side gaps or deferred
manual smoke testing, none blocking).

**Goal:** Bring `mfu-events-web` (Next.js frontend) in line with the v18
backend contract: the **organizer portal** is open to any authenticated
user (no special role needed to reach it), organizations are optional
*affiliation* records rather than mandatory registered entities for most
purposes, **but** event **creation** and event-request **submission** both
require the acting user to be an active member of an active organization
(reinstated by backend commits `1411ddd`/`2ff2609`, see "Correction" below).
A batch of new backend routes (event requests, contributors, staff calls,
self check-in, recognition, review edit, platform settings) currently have
zero frontend UI.

**CORRECTION (2026-10-08):** The migration doc's own TL;DR line ("no
club/department membership required") is stale — see `plan.md`'s "Doc
inconsistency" callout. Event creation and event-request submission need an
active org membership; only *portal access* is org-free. `plan.md` is the
up-to-date source of truth for this folder; read it, not just this README.

**Source of truth:** `/Users/panda/Desktop/MFU-Events/.docs/03-engineering/frontend-v18-migration.md`
(read in full before implementing any phase — and read §2/"Event Requests —
User App" over its own TL;DR, per the correction above). Backend tracking
docs (`MIGRATION_PLAN.md`, `MIGRATION_ANALYSIS.md` in the backend's `docs/`)
are cross-referenced context only — do not treat them as authoritative for
the frontend contract.

**Status:** Planning complete, including a correction pass for the
org-membership premise change. Implementation: Phase 1 complete (2026-10-08);
Phase 2 complete (2026-10-08); Phase 3 complete (2026-10-08); Phase 4 complete
(2026-10-08); Phase 5 complete (2026-10-08); Phase 6 complete (2026-10-08);
Phase 7 complete (2026-10-08); Phase 8 complete (2026-10-08); Phase 9
complete (2026-10-08); Phase 10 complete (2026-10-08); Phase 11 complete
(2026-10-08); Phase 12 complete (2026-10-08); Phase 13 complete (2026-10-08);
Phase 14 complete (2026-10-08); Phase 15 complete (2026-10-08); Phase 16
complete (2026-10-08); Phase 17 complete (2026-10-08); Phase 18 complete
(2026-10-08); Phase 19 complete (2026-10-08).
**All 19 original phases complete.** Phases 20-23 are planned (2026-10-08)
but **not started** — see "Phase list" below.

## Quick orientation

- `plan.md` — full plan: goal, doc-inconsistency callout, existing patterns,
  files to change, phases, risks, verification. **Read this first.**
- `research/requirements.md` — breaking-change-by-breaking-change map from
  the spec to confirmed frontend findings, plus a 2026-10-08 correction
  addendum on row #2 and a second 2026-10-08 addendum covering the four
  post-Phase-19 backend commits that phases 20-23 consume.
- `research/existing-code.md` — how `lib/api.js`, `lib/session.js`, and the
  `app/*/actions.js` server-action pattern work, with file:line references,
  plus a correction addendum on `EVENT_MANAGING_ROLES` and the
  `my-organizers` response shape.
- `research/references.md` — links to the authoritative doc section headers
  and the backend's own migration-tracking docs.
- `phases/phase-*.md` — one file per phase, each independently shippable and
  revertable, in execution order. Phases 2 and 12 were fully rewritten on
  2026-10-08; phases 1 and 13 got append-only correction notes; phase 12 got
  a second append-only correction note resolving its "resubmit + org_id"
  risk. Phases 20-23 are new, planning-only (status "Not started").

## Phase list (execution order)

**Part A — Critical breaking changes (fix first, ship each independently)**

1. Organizer portal access — any authenticated user (`lib/session.js`, portal layouts)
2. Event creation endpoint — `POST /api/organizer/events`; **`org_id` required**, sourced from the user's active org memberships (corrected 2026-10-08)
3. Organizer "My Events" / check-in listing — `GET /api/organizer/events` (complete 2026-10-08)
4. Event detail shape — organizer app (`team` / `contributors` / `myRole`) (complete 2026-10-08)
5. Event detail shape — admin app (`team` / `contributors` / `requester_snapshot`) (complete 2026-10-08)
6. Admin Organizations — `/api/admin/organizations`, pending→active, activate/deactivate (complete 2026-10-08)
7. Organizer flag action rename — `suspend` → `restrict` (complete 2026-10-08)
8. Remove Items & Equipment entirely (complete 2026-10-08)
9. Profile page — drop `/api/user/me/organizers` (complete 2026-10-08)
10. Review submission gated on event end time (complete 2026-10-08)

**Part B — Missing features (new backend routes, net-new UI)**

11. Register, email verification, forgot/reset password (complete 2026-10-08)
12. Event Requests — user app; **`org_id` required for every role** (corrected 2026-10-08, complete 2026-10-08)
13. Event Requests — admin app (minor correction: render org as a first-class field) (complete 2026-10-08)
14. Contributors tier — organizer app (complete 2026-10-08)
15. Staff Calls — organizer + user apps (complete 2026-10-08)
16. Self check-in — user app (complete 2026-10-08)
17. Recognition — user app (complete 2026-10-08)
18. Review edit/delete — user app (complete 2026-10-08)
19. Admin Platform Settings page (complete 2026-10-08)

**Part C — Post-Phase-19 backend follow-up consumption (planned, not started)**

20. Review edit window — `GET /api/user/settings` replaces the hardcoded `REVIEW_EDIT_WINDOW_DAYS` in `ReviewsSection.jsx`
21. Venue schedule organizer chip restored — `venueService.schedule()` now embeds `org`/`main_organizer`
22. Organization discovery & self-serve join requests — user app (`/api/user/organizations*`)
23. Organization applications queue & `application_open` toggle — organizer app, org_manager only (`/api/org/*`)

## Recommended first implementation step

Start with Phase 1 (`lib/session.js` + the three portal layouts). It is the
smallest change, unblocks every other organizer-portal phase, and is
trivially revertable (a guard-clause change plus three layout files). Follow
it immediately with the corrected Phase 2 — see `plan.md`'s "Recommended
first implementation step" for why Phase 2's org-membership-sourcing pattern
should be gotten right early, since Phase 12 duplicates it.

For Part C, start with Phase 21 (`app/admin/venues/schedule/page.js`) — the
smallest, lowest-risk, zero-dependency change in this whole plan. See
`plan.md`'s "Recommended first implementation step" for the full Part C
ordering rationale.
