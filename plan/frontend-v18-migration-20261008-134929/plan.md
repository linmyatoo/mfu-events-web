# Frontend v18 Migration — Master Plan

## ALL 23 PHASES COMPLETE (2026-10-09)

The frontend v18 migration plan's original 19 phases, plus follow-up Phases
20-23, are fully executed — every breaking change (Part A, phases 1-10),
every net-new feature surface (Part B, phases 11-19), and every
post-Phase-19 backend follow-up (Part C, phases 20-23) listed in the
acceptance criteria has a shipped implementation, and `npm run
lint`/`npm run build` pass as of the Phase 23 commit. See each
`phases/phase-*.md` file's own "Status" block for implementation notes,
drift found against the real backend source, and per-phase deviations.

**Phases 20-23 consumed the post-Phase-19 backend work** (four `MFU-Events`
commits: `029684f`, `1d4a639`, plus doc/test-only commits `48ffc32`,
`f0f7f40`, `fd9f343`, `16435a8`) — see `research/requirements.md`'s
2026-10-08 addendum for the full verified contract of every new/changed
route, and the individual phase files for implementation detail:
- Phase 20 — real `review_edit_window_days` via `GET /api/user/settings`.
- Phase 21 — organizer chip restored on the admin venue schedule page.
- Phase 22 — organization discovery & self-serve join requests (user app).
- Phase 23 — org_manager applications queue & `application_open` toggle.

**Not yet done:** manual smoke testing against a live backend (every phase,
including 20-23, has deferred this — see each phase's "Verification"
section for the manual steps still outstanding) and a commit of the
Phase 20-23 changes.

**Outstanding follow-ups collected from phase status blocks** (updated
2026-10-08 — three of the original six are now unblocked by new backend
work; see the phase references below):

- **`app/admin/venues/schedule/page.js` — organizer chip dropped (Phase
  6).** **RESOLVED, see Phase 21.** `venueService.schedule()` now embeds
  `org`/`main_organizer` on each event (backend commit `029684f`) — the
  small backend follow-up this bullet asked for has landed; Phase 21
  restores the chip using the new fields.
- **`review_edit_window_days` stays hardcoded in `ReviewsSection.jsx`
  (Phases 18 and 19).** **RESOLVED, see Phase 20.** A new non-admin-readable
  endpoint, `GET /api/user/settings`, landed in backend commit `029684f`
  specifically to unblock this — exactly the kind of backend change this
  bullet asked for. Phase 20 wires it in.
- **No self-serve "join an organization" flow exists anywhere in this
  codebase** (Phases 2 and 12). **RESOLVED, see Phases 22 and 23.** Backend
  commit `1d4a639` added a full self-serve join-request flow
  (`application_open` org flag, user-side discover/apply, org_manager-side
  approval queue). Phase 22 builds the user-side discovery/apply UI; Phase
  23 builds the org_manager-side applications queue and `application_open`
  toggle. Phases 2 and 12's zero-eligible-org blocking copy ("contact an
  org manager/admin") can now additionally point users at `/organizations`
  once Phase 22 ships — not required for Phase 22/23 to be independently
  shippable, but worth a follow-up copy tweak once both are live.
- **Resubmit + org_id (Phase 12):** `eventRequestService.resubmitRequest`
  does not re-validate org membership on resubmit (only `createRequest`
  does). **RESOLVED server-side, no frontend change needed** — see the
  2026-10-08 correction addendum appended to
  `phases/phase-12-event-requests-user.md`. Backend commit `029684f` added
  the same eligibility re-check to resubmit; the frontend's existing
  `failure(error)` helper already surfaces the resulting messages
  correctly. One stale code comment (`app/actions.js:370-372`) should be
  fixed whenever that file is next touched — not urgent enough for its own
  phase.
- **Manual sign-in/smoke testing against a running dev backend was deferred
  in nearly every phase** (no backend process was started in these
  implementation sessions) — explicitly noted in phases 1, 2, 3, 8, 13, 14,
  15, 16, and 19, and still applies to planned phases 20-23. Run `plan.md`'s
  "Cross-phase smoke tests" section (and each phase file's own "Manual:"
  verification steps) against a live `MFU-Events` backend before considering
  any of this production-ready. (The backend's own `backend/smoke-test.js`,
  added in commit `fd9f343`, independently covers several of the same
  contracts server-side and is worth running too.)
- **Role no longer matters for org-based event creation** (Phase 2) —
  `isMember()` has no role check, a real behavior change from the prior
  frontend's `EVENT_MANAGING_ROLES` gate. Worth calling out in any PR
  description/review since it is easy to miss as "just a shape fix." Still
  open — unaffected by the new backend work.
- **`GET /api/organizer/events/:id` `/contributors` endpoint shape mismatch
  (Phase 14, informational only):** the standalone endpoint returns `{ ...ec,
  user }` while the event-detail route flattens to `{ ...ec, name }` — noted
  in case a later change reaches for that endpoint directly and assumes the
  flattened shape; not a bug today since nothing in this plan calls it.
  Still open — unaffected by the new backend work.

---

**Status:** Planning complete, including a 2026-10-08 correction pass for a
backend premise change. Implementation: Phase 1 complete (2026-10-08); Phase
2 complete (2026-10-08); Phase 3 complete (2026-10-08); Phase 4 complete
(2026-10-08); Phase 5 complete (2026-10-08); Phase 6 complete (2026-10-08);
Phase 7 complete (2026-10-08); Phase 8 complete (2026-10-08); Phase 9
complete (2026-10-08); Phase 10 complete (2026-10-08); Phase 11 complete
(2026-10-08); Phase 12 complete (2026-10-08); Phase 13 complete
(2026-10-08); Phase 14 complete (2026-10-08); Phase 15 complete
(2026-10-08); Phase 16 complete (2026-10-08); Phase 17 complete
(2026-10-08); Phase 18 complete (2026-10-08); Phase 19 complete
(2026-10-08); see
`phases/phase-1-organizer-portal-access.md`,
`phases/phase-2-event-creation-endpoint.md`,
`phases/phase-3-organizer-event-listing.md`,
`phases/phase-4-organizer-event-detail-shape.md`,
`phases/phase-5-admin-event-detail-shape.md`,
`phases/phase-6-admin-organizations.md`,
`phases/phase-7-organizer-flag-action-rename.md`,
`phases/phase-8-remove-items-equipment.md`,
`phases/phase-9-profile-organizers.md`,
`phases/phase-10-review-submission-window.md`,
`phases/phase-11-register-and-password-flows.md`,
`phases/phase-12-event-requests-user.md`,
`phases/phase-13-event-requests-admin.md`,
`phases/phase-14-contributors.md`,
`phases/phase-15-staff-calls.md`,
`phases/phase-16-self-checkin.md`,
`phases/phase-17-recognition.md`,
`phases/phase-18-review-edit-delete.md`, and
`phases/phase-19-platform-settings.md` status notes. **All 19 original
phases complete.** Phases 20-23 (post-Phase-19 backend follow-up
consumption — see the top of this file) are **planned, not started**: see
`phases/phase-20-review-edit-window-setting.md`,
`phases/phase-21-venue-schedule-organizer-chip.md`,
`phases/phase-22-org-discovery-and-apply-user.md`, and
`phases/phase-23-org-manager-applications-queue.md`.

## Goal

Bring `mfu-events-web` (this Next.js frontend) in line with the v18 backend
contract documented in
`/Users/panda/Desktop/MFU-Events/.docs/03-engineering/frontend-v18-migration.md`:
fix ten breaking changes to existing pages/actions, and build nine net-new
feature surfaces (event requests, contributors, staff calls, self check-in,
recognition, review edit/delete, platform settings, auth flows) that
currently have zero frontend UI.

## Doc inconsistency — read this before trusting the spec's TL;DR

The source-of-truth doc's own **TL;DR** paragraph says: *"Any user (student
or staff) can organize an event directly — no club/department membership
required."* **This line is stale and self-contradictory within the same
file.** Two backend commits (`1411ddd`, `2ff2609`, both 2026-10-08, after the
original TL;DR was written) reinstated an org-membership requirement for
both event **creation** and event **request submission**:

- `POST /api/organizer/events` requires `org_id` in the body. The org must
  exist, be `status: "active"`, and the caller must be an active member
  (`orgMembershipService.isMember(org_id, userId)`). Non-member or inactive
  org → **403**.
- `POST /api/user/event-requests` requires `org_id` for **every** role
  (student, faculty, staff). The old faculty/staff solo `represented_as`
  path is fully removed. Missing/invalid org_id → **403**.

The doc's own **breaking-change §2** and **"Event Requests — User App"**
section *were* updated by `1411ddd` and correctly describe the `org_id`-required
rule — only the top TL;DR paragraph was missed. **Treat §2 and the Event
Requests section as ground truth over the TL;DR line.**

What did **not** change: **organizer portal access** (doc §6). Any
authenticated user can still reach the organizer portal/UI regardless of org
membership — `lib/session.js`'s `requireOrganizer()`/`EVENT_MANAGING_ROLES`
portal-gate should still be loosened exactly as originally planned (Phase 1).
Only event **creation** and event-request **submission** require active org
membership again. Portal access and creation/request eligibility are two
separate gates — do not conflate them during implementation.

This correction touches two phase files directly
(`phases/phase-2-event-creation-endpoint.md`,
`phases/phase-12-event-requests-user.md`, fully rewritten) and one with a
minor addition (`phases/phase-13-event-requests-admin.md`, append-only note).
All other phase files were reviewed and found unaffected. See "Phase files
corrected in this pass" below.

## Acceptance criteria

- Every item in the doc's "Breaking Changes — Fix These First" (1-10) list
  is fixed and manually verified against a running dev backend.
- Every item in "New Features to Build" has a working, navigable UI.
- `npm run lint` and `npm run build` pass after every phase.
- No regressions in already-aligned areas (points approval workflow — see
  `research/requirements.md` "Already aligned" section).
- Event creation and event-request submission correctly enforce active org
  membership client-side (clear blocking UI) in addition to the backend's
  403 enforcement — not a silent failure or a crash.
- **(Part C, phases 20-23)** `review_edit_window_days` is read from `GET
  /api/user/settings` rather than hardcoded; the admin venue schedule shows
  the organizer chip again; a signed-in user can discover orgs open for
  applications, apply with an optional message, and see their application
  history/status; an org_manager can see and resolve their org's
  applications queue and toggle `application_open`.

## Existing patterns (see `research/existing-code.md` for full detail)

- **`lib/api.js`** — `apiGet/apiPost/apiPatch/apiPut/apiDelete(path, body?)`
  server-side wrappers; `ApiError(message, status, details)` on non-2xx;
  `apiGetAllowed(path)` swallows 403 → `null` for permission-gated admin
  panels; `scrub()` strips `password_hash` from responses.
- **`lib/session.js`** — `getSession()`, `requireUser()`, `requireAdmin()`,
  `getMyOrganizers()` (`GET /api/organizer/my-organizers`, returns `{
  ...membership, org: {...} }` — **not** `organizer`), `requireOrganizer()`
  (portal guard), `portalsFor(user, memberships)` (switcher entries).
- **`app/*/actions.js` server-action pattern** — `'use server'`, a local
  `failure(error)` helper (`ApiError` → `{ error, details }`, anything else
  rethrown), `(_prevState, formData)` signature for `useActionState`-bound
  forms, positional-arg signature for `useTransition`-bound buttons,
  `revalidatePath(...)` after mutations, `redirect(...)` after creation.
  Three existing files to extend: `app/actions.js` (user), `app/organizer/actions.js`,
  `app/admin/actions.js`.
- **Portal layouts** — `app/(app)/layout.js`, `app/organizer/layout.js`,
  `app/admin/layout.js` each call their `require*` guard + `getMyOrganizers()`/`portalsFor()`
  and render `<AppShell>`. `components/navigation/navItems.js` holds the
  static nav arrays per portal.
- **Forms** — `useActionState(action, { error: null })`, `state?.error`
  rendered as `<p className="field__error">`, submit disabled while
  `pending`. Search-as-you-type pickers (`TeamManager.jsx`,
  `OrganizerMembers.jsx`) duplicate the same local-state pattern rather than
  sharing a component — follow suit for new pickers unless asked to dedupe.

## Files to change

Grouped by phase below. The full breaking-change-to-file map is in
`research/requirements.md`; the pattern reference is in
`research/existing-code.md`.

## Phase plan (execution order)

**Part A — Critical breaking changes (fix first, ship each independently)**

1. `phases/phase-1-organizer-portal-access.md` — `lib/session.js`
   (`requireOrganizer`/`portalsFor`), `app/organizer/layout.js`. Portal-entry
   gating only. **Unaffected by the org correction** (confirmed, append-only
   note added).
2. `phases/phase-2-event-creation-endpoint.md` — **REWRITTEN.**
   `app/organizer/actions.js`, `app/organizer/events/new/page.js`,
   `components/organizer/EventForm.jsx`. URL changes to `POST
   /api/organizer/events`; `org_id` stays **required**, sourced from the
   user's own active org memberships (`GET /api/organizer/my-organizers`,
   filtered to `org.status === 'active'`); zero-eligible-org case blocks
   submission with an explanation instead of redirecting; drop the stale
   `EVENT_MANAGING_ROLES` role filter since the backend only checks
   membership, not role.
3. `phases/phase-3-organizer-event-listing.md` — `app/organizer/page.js`,
   `app/organizer/check-in/page.js`. Flatten the per-org `Promise.all` fetch
   to a single `GET /api/organizer/events`. Unaffected by the org
   correction (this is about *listing* events the user is already on the
   team of, not creating them). **Complete (2026-10-08).**
4. `phases/phase-4-organizer-event-detail-shape.md` —
   `app/organizer/events/[id]/page.js`. New `team`/`contributors`/`myRole`
   shape. **Complete (2026-10-08).**
5. `phases/phase-5-admin-event-detail-shape.md` — `app/admin/events/[id]/page.js`.
   New `team`/`contributors`/`requester_snapshot` shape; drop
   `requested_venue`. **Complete (2026-10-08).**
6. `phases/phase-6-admin-organizations.md` — `app/admin/organizers/page.js`,
   `app/admin/organizers/[id]/page.js`, `app/admin/actions.js`,
   `components/admin/NewOrganizerForm.jsx`, `components/admin/OrganizerMembers.jsx`,
   `lib/events.js`, `app/admin/page.js`, `app/admin/venues/schedule/page.js`.
   Entity CRUD → `pending→active`/`activate`/`deactivate` affiliation model.
   **Complete (2026-10-08).**
7. `phases/phase-7-organizer-flag-action-rename.md` —
   `components/admin/FlagResolver.jsx`, `app/admin/actions.js` (comment
   only). `suspend` → `restrict`. **Complete (2026-10-08).**
8. `phases/phase-8-remove-items-equipment.md` — delete
   `app/(app)/items/page.js`, `app/admin/items/page.js`, three components,
   trim `app/organizer/actions.js`/`app/admin/actions.js`/nav/profile.
   **Complete (2026-10-08).**
9. `phases/phase-9-profile-organizers.md` — `app/(app)/profile/page.js`.
   Drop `/api/user/me/organizers`. **Complete (2026-10-08).**
10. `phases/phase-10-review-submission-window.md` —
    `components/events/ReviewsSection.jsx`. Gate review submission on
    `isPastEvent(event)`. **Complete (2026-10-08).**

**Part B — Missing features (new backend routes, net-new UI)**

11. `phases/phase-11-register-and-password-flows.md` — `app/actions.js`,
    `app/register/page.js`, `app/forgot-password/page.js`,
    `app/reset-password/page.js`, `app/verify-email/page.js`,
    `components/auth/*` (new), `app/login/page.js`. **Complete (2026-10-08).**
12. `phases/phase-12-event-requests-user.md` — **REWRITTEN. Complete
    (2026-10-08).** `app/actions.js`,
    `app/(app)/event-requests/{page,new/page,[id]/page}.js` (new),
    `components/events/EventRequestForm.jsx` (new), `lib/events.js`,
    `components/navigation/navItems.js`. `org_id` required for all roles,
    same active-membership sourcing/blocking pattern as Phase 2, resubmit
    keeps `org_id` read-only.
13. `phases/phase-13-event-requests-admin.md` — **MINOR ADDITION (append-only).
    Complete (2026-10-08).**
    `app/admin/actions.js`, `app/admin/event-requests/{page,[id]/page}.js`
    (new), `components/admin/EventRequestReview.jsx` (new),
    `components/admin/RequesterHealthPanel.jsx` (new, shared with Phase 5,
    also retrofitted into `app/admin/events/[id]/page.js`).
    Structurally unaffected by the org correction; always renders the (now
    mandatory) org name on each request, resolved via
    `GET /api/admin/organizations` — confirmed neither admin event-requests
    route embeds `org` (same gap Phase 12 found on the user side).
14. `phases/phase-14-contributors.md` — `app/organizer/actions.js`,
    `components/organizer/ContributorsManager.jsx` (new),
    `app/organizer/events/[id]/page.js`.
15. `phases/phase-15-staff-calls.md` — `app/organizer/actions.js`,
    `app/actions.js`, `components/organizer/StaffCallsManager.jsx` (new),
    `app/(app)/staff-calls/*` (new), `components/events/StaffCallApplyForm.jsx`
    (new), nav. **Complete (2026-10-08).**
16. `phases/phase-16-self-checkin.md` — `app/actions.js`, booking detail
    component, `components/organizer/CheckInScanner.jsx` (reuse check),
    `checkin_mode` field added to Phase 2/12's forms. **Complete
    (2026-10-08).**
17. `phases/phase-17-recognition.md` — `app/(app)/recognition/page.js` (new), nav. **Complete (2026-10-08).**
18. `phases/phase-18-review-edit-delete.md` — `app/actions.js`,
    `components/events/ReviewsSection.jsx`. Depends on Phase 10 (same file).
    **Complete (2026-10-08).**
19. `phases/phase-19-platform-settings.md` — `app/admin/actions.js`,
    `app/admin/settings/page.js` (new), `components/admin/SettingsForm.jsx`
    (new), nav. **Complete (2026-10-08).** Steps 1-3 shipped as scoped;
    Step 4 (thread the real `review_edit_window_days` into
    `ReviewsSection.jsx`) found genuinely blocked by the admin-only
    `GET /api/admin/settings` route rather than merely deferred — see the
    phase file and the "Outstanding follow-ups" note at the top of this
    plan.

**Part C — Post-Phase-19 backend follow-up consumption (planned, not started)**

20. `phases/phase-20-review-edit-window-setting.md` —
    `app/(app)/events/[id]/page.js`, `app/organizer/events/[id]/page.js`,
    `components/events/ReviewsSection.jsx`. Consumes new `GET
    /api/user/settings` (backend commit `029684f`) to replace the
    hardcoded `REVIEW_EDIT_WINDOW_DAYS = 7`. Resolves the Phase 18/19
    follow-up.
21. `phases/phase-21-venue-schedule-organizer-chip.md` —
    `app/admin/venues/schedule/page.js` only. Consumes the new
    `org`/`main_organizer` embed on `venueService.schedule()` (same
    backend commit) to restore the organizer chip Phase 6 dropped.
22. `phases/phase-22-org-discovery-and-apply-user.md` — `lib/events.js`,
    `app/actions.js`, `components/events/OrgApplyForm.jsx` (new),
    `app/(app)/organizations/page.js` (new),
    `components/navigation/navItems.js`. User-side discovery + apply flow
    against the new `/api/user/organizations*` routes (backend commit
    `1d4a639`). No per-id detail page — see the phase file's note on why
    no `GET /api/user/organizations/:id` route exists.
23. `phases/phase-23-org-manager-applications-queue.md` —
    `app/organizer/actions.js`,
    `app/organizer/organizations/{page,[id]/page}.js` (new),
    `components/organizer/OrgApplicationsManager.jsx` (new),
    `components/navigation/navItems.js`. Org_manager-side applications
    queue + `application_open` toggle against the new `/api/org/*` routes
    (same backend commit). Independent of Phase 22 — confirms the
    frontend's existing `membership.role` convention
    (`org_manager`/`member`, already used by `OrganizerMembers.jsx`) needs
    no new client-side role-check code; `GET /api/org/my-orgs` is the real
    authorization boundary.

## Phase files corrected in this pass (2026-10-08)

- **`phases/phase-2-event-creation-endpoint.md`** — fully rewritten. Was:
  "drop the orgId requirement, remove the org picker." Now: keep the org
  picker, keep `org_id` required, source it from active org memberships,
  fix the membership field names (`org`/`org_id`, not `organizer`/`organizer_id`),
  drop the stale `EVENT_MANAGING_ROLES` role filter (backend only checks
  membership, not role), add explicit zero-eligible-org and 403 handling.
- **`phases/phase-12-event-requests-user.md`** — fully rewritten. Was
  silent on `org_id` (doc at the time of the original planning run had
  already been patched to require it, but the phase file hadn't caught up).
  Now: `org_id` required for every role, same org-sourcing/blocking pattern
  as Phase 2, explicit note that `represented_as`/solo paths don't exist,
  resubmit keeps `org_id` read-only (backend quirk: resubmit doesn't
  re-validate membership).
- **`phases/phase-13-event-requests-admin.md`** — append-only correction
  note added (no rewrite needed; structurally already correct). Flags that
  `org_id` is now always present on requests and should be rendered as a
  first-class field, not optional context.
- **`phases/phase-1-organizer-portal-access.md`** — append-only confirmation
  note added (no rewrite needed). Confirms this phase stays scoped to portal
  **entry** gating and does not claim event creation is org-free.
- **`research/requirements.md`**, **`research/existing-code.md`** — append-only
  correction addenda added so the research trail doesn't contradict the
  corrected phases.
- **Phases 3-11, 14-19** — read in full, confirmed unaffected by the org
  correction (they concern listing/shape/removal/rename/net-new-unrelated-features,
  not event creation or request-submission eligibility). No changes made.

## Phase files corrected in this pass (2026-10-08, round 2 — phases 20-23 scoping)

- **`phases/phase-12-event-requests-user.md`** — append-only correction
  note added (no rewrite needed). Documents that backend commit `029684f`
  resolved this phase's own flagged "Resubmit + org_id" risk server-side,
  and that no frontend code change is required beyond fixing one stale
  comment in `app/actions.js`.
- **`research/requirements.md`** — new append-only addendum added
  documenting the full verified contract of all four post-Phase-19 backend
  commits (`029684f`, `1d4a639`, plus doc/test commits `48ffc32`,
  `f0f7f40`, `fd9f343`, `16435a8`).
- **New phase files added:** `phases/phase-20-review-edit-window-setting.md`,
  `phases/phase-21-venue-schedule-organizer-chip.md`,
  `phases/phase-22-org-discovery-and-apply-user.md`,
  `phases/phase-23-org-manager-applications-queue.md`. All planning-only —
  status "Not started" until implemented.

## Risks and unknowns

- **Resubmit + org_id — RESOLVED (2026-10-08).** Backend commit `029684f`
  added the same eligibility re-check to `resubmitRequest` that
  `createRequest` already had. `org_id` still stays read-only in the
  resubmit UI (no reason to let a resubmit silently swap orgs, backend gap
  or not), but the gap itself is closed server-side and no frontend change
  is needed — see the correction addendum on
  `phases/phase-12-event-requests-user.md`.
- **No self-serve "join an organization" flow exists anywhere in this
  codebase — RESOLVED (2026-10-08), see Phases 22/23.** Backend commit
  `1d4a639` added the full flow (discovery, apply, approval queue,
  `application_open` toggle); Phases 22 and 23 build the frontend for it.
  Phases 2 and 12's zero-eligible-org blocking copy can point users at
  `/organizations` once Phase 22 ships (optional copy follow-up, not
  required for either phase to ship independently).
- **Role no longer matters for org-based event creation** (`isMember()` has
  no role check) — this is a real behavior change from the current frontend
  (which gates on `EVENT_MANAGING_ROLES`). Call this out explicitly in PR
  description/review since it's easy to miss as "just a shape fix."
- **`GET /api/admin/event-requests/:id` org embedding — resolved
  (2026-10-08).** Confirmed by reading `backend/routes/admin.js` directly:
  neither the list nor the detail route embeds `org` (same gap Phase 12
  found on the user side). Both embed `requester`; the detail route also
  embeds `eligibility`. Phase 13 resolves the org name via a second fetch to
  `/api/admin/organizations`/`:id` (Phase 6's routes).
- **`app/verify-email/page.js` (Phase 11) blocked on a backend question** —
  whether `GET /api/auth/verify-email` redirects to a frontend route on
  completion, and with what query params. Genuinely needs a backend-dev
  answer, not inferable from the doc.
- **General migration risk** — this plan touches nearly every page in the
  app across 19 phases; shipping each phase independently (as designed) and
  verifying before moving to the next is the main mitigation. No feature
  flags are planned (none exist in this codebase today) — rollback is via
  `git revert` per phase, which is why each phase is scoped to a disjoint-as-possible
  file set.

## Verification

Per-phase: `npm run lint` && `npm run build` (no `test` script exists in this
repo — confirmed in `research/references.md`), plus the manual steps listed
in each `phases/phase-*.md` file.

Cross-phase smoke tests to run after Part A (phases 1-10) and again after
Part B (phases 11-19), using this repo's existing dev-server pattern:

```bash
npm run dev   # against a running MFU-Events dev backend
```

1. **Login** — sign in as a plain student with zero org memberships.
2. **Organizer portal access** — confirm the Organizer tab appears and
   `/organizer` does not redirect to `/` (Phase 1).
3. **Event creation** — go to `/organizer/events/new`. With zero active org
   memberships, confirm the blocking explanation renders (Phase 2). Then
   sign in as a user with an active org membership (check backend seed
   data), create a draft event, confirm `org_id` is set and the user is
   `main_organizer`.
4. **Admin Organizations** — sign in as admin, visit `/admin/organizers`,
   confirm `All/Pending/Active/Inactive` tabs, activate/deactivate an org,
   confirm status updates (Phase 6).
5. **Event Requests (Part B)** — as the same zero-active-org student, visit
   `/event-requests/new`, confirm the same blocking explanation as step 3.
   As a user with an active org membership, submit a request, confirm it
   lists as `pending` with the org name shown; as admin, open
   `/admin/event-requests`, approve/reject/needs-info it, confirm the
   requester sees the outcome.

Cross-phase smoke test to run after Part C (phases 20-23), in addition to
each phase file's own "Manual:" steps:

6. **Settings-driven review window (Phase 20)** — change
   `review_edit_window_days` via `/admin/settings` to a small number,
   confirm a recent review's Edit/Delete controls disappear on reload
   without a code change.
7. **Venue schedule organizer chip (Phase 21)** — visit
   `/admin/venues/schedule`, confirm each scheduled event shows its main
   organizer and requesting org.
8. **Org join flow (Phases 22-23)** — as a user with no org memberships,
   visit `/organizations`, apply to a seeded open org (`org1`/`org2`) with
   a message. As that org's manager, visit `/organizer/organizations`,
   approve the application from the queue, confirm the applicant is now an
   active `member` and can create events/submit requests for that org
   (Phases 2/12's existing membership-sourcing already picks this up with
   no further change). Separately, reject a second application with
   feedback and confirm the applicant sees it on `/organizations`'s "Mine"
   tab. Toggle `application_open` off and confirm the org disappears from
   `/organizations`'s "Discover" tab.

## Recommended first implementation step

Start with Phase 1 (`lib/session.js` + the three portal layouts) exactly as
originally recommended — it is the smallest change, unblocks every other
organizer-portal phase, and is trivially revertable. **Immediately follow it
with the corrected Phase 2** (not the original Part A ordering's implicit
assumption that org-optional creation was a smaller change than it is) —
Phase 2 is now medium-risk precisely because it has to carry the full
org-membership-sourcing logic that Phase 12 will duplicate, so getting its
pattern right first (membership field names, zero-eligible-org blocking
state, dropped role filter) pays off twice.

**For Part C (phases 20-23):** start with Phase 21 (`app/admin/venues/schedule/page.js`,
one file, purely additive) — it's the single smallest, lowest-risk change
in this whole plan and has zero dependencies. Phase 20 is similarly small
and independent; do it next. Phases 22 and 23 are independent of each other
and of 20/21, but if sequencing for a single reviewer's attention, do
Phase 22 (user-side) before Phase 23 (org_manager-side) so there's
something to approve/reject by the time Phase 23's queue UI is manually
tested — though per each phase file's own notes, Phase 23 can be verified
against backend test/seed data alone even if Phase 22 hasn't shipped yet.
