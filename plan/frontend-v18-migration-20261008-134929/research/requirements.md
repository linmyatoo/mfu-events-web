# Requirements map — spec section → confirmed frontend finding → files

Spec: `/Users/panda/Desktop/MFU-Events/.docs/03-engineering/frontend-v18-migration.md`

## Breaking changes (doc "Breaking Changes" section, items 1-10)

| # | Doc section | Confirmed finding | Files |
|---|---|---|---|
| 1 | `/api/creator/*` gone | Not found in this frontend — grepped, no `/api/creator` calls exist. No action needed, note only. | — |
| 2 | Event creation URL changed | `createEventAction` posts to `/api/organizer/organizers/:orgId/events`, requires `orgId` from the form. Same stale per-org listing pattern reused in 3 more places. | `app/organizer/actions.js:81-98`, `app/organizer/page.js:28-42`, `app/organizer/check-in/page.js:24-34`, `app/organizer/events/new/page.js:14-24`, `components/organizer/EventForm.jsx:38-58` (org picker `<select>`) |
| 3 | Event response shape — fields | `event.organizer_id` read nowhere directly (confirmed via grep — only `membership.organizer_id` which is unrelated/unaffected). New fields (`source_request_id`, `org_id`, `is_point_event`, `organizer_points_base`, `checkin_mode`, `checkin_qr_token`) unused anywhere — needed for Phase 16 (self check-in) and already partially rendered (`is_point_event`, `organizer_points_base` in admin/organizer event detail pages). | `app/organizer/events/[id]/page.js:78-80`, `app/admin/events/[id]/page.js:64-68` (already read `is_point_event`/`organizer_points_base` — fine, keep) |
| 4 | Event detail shape — user/organizer/admin | Organizer event detail expects old `{ team, organizer }`; needs `{ team, contributors, myRole }` (myRole already read correctly at `event.myRole`, doc's "after" shape matches current code for that field — only `contributors` is net-new and `event.organizer` entity becomes optional/nullable). Admin event detail expects old `{ organizer, requested_venue }`; needs `{ team (with `.user`), contributors, requester_snapshot }`. User event detail (`app/(app)/events/[id]/page.js`) not yet read in detail — verify against doc's `{ organizers: [...], organizer: entity-or-null }` shape during Phase 4/5 implementation. | `app/organizer/events/[id]/page.js` (whole file), `app/admin/events/[id]/page.js` (whole file), `app/(app)/events/[id]/page.js` (verify during implementation) |
| 5 | `/api/user/me/organizers` removed | `ProfilePage` calls it directly and renders an "Organizer memberships" section from it. | `app/(app)/profile/page.js:31-39,79-103` |
| 6 | Organizer portal role check | `requireOrganizer()` redirects to `/` when `memberships.length === 0`; `portalsFor()` only offers the Organizer switcher entry when `memberships?.length`. Both are the access gate that must become "any authenticated user." | `lib/session.js:67-72,82-91` |
| 7 | Organizer flag actions | `resolveOrganizerFlagAction` forwards whatever `action` string the caller sends (comment says `suspend`, needs to say `restrict` per new allowed set `dismiss/warn/restrict/deactivate`); `FlagResolver.jsx` hardcodes the `suspend` button value/label. | `app/admin/actions.js:304-315` (doc comment only — passthrough is already generic), `components/admin/FlagResolver.jsx:14-23` |
| 8 | Review blocked until event ends | `ReviewsSection.jsx` gates the submit form on `attended booking + not already reviewed` only — no `isPastEvent` check, so a checked-in-but-not-yet-ended event (e.g. multi-day) would show a form the backend now 400s on. | `components/events/ReviewsSection.jsx:58-59,93` |
| 9 | Admin organizer entity → organization | Full admin organizer CRUD + approve/reject/suspend workflow hits `/api/admin/organizers*`; new backend is `/api/admin/organizations*` with `pending→active`/`activate`/`deactivate` only. `FilterTabs` options include stale `rejected`/`suspended`. | `app/admin/organizers/page.js` (whole file), `app/admin/organizers/[id]/page.js` (whole file), `app/admin/actions.js:149-213` (`createOrganizerAction`, `organizerDecisionAction`, `add/update/removeOrganizerMemberAction`), `components/admin/NewOrganizerForm.jsx`, `components/admin/OrganizerMembers.jsx:56-83` (approve/reject buttons) |
| 10 | Items & Equipment removed | Entire feature still wired: user catalogue page, admin inventory page, organizer item-request form on the event detail page, admin item-request review, three server actions, one nav entry, one profile shortcut tile. All of these now hit 404s. | `app/(app)/items/page.js`, `app/admin/items/page.js`, `app/organizer/actions.js:267-288` (`saveItemRequestsAction`), `app/admin/actions.js:256-302` (`saveItemAction`, `resolveItemRequestAction`), `components/organizer/ItemRequestForm.jsx`, `components/admin/ItemRequestReview.jsx`, `components/admin/ItemForm.jsx`, `app/organizer/events/[id]/page.js:56-57,167-174` (items/requests fetch + `<ItemRequestForm>`), `app/admin/events/[id]/page.js:48,132-134` (`item-requests` fetch + `<ItemRequestReview>`), `components/navigation/navItems.js:30` (`/admin/items` nav entry), `app/(app)/profile/page.js:14` (Equipment catalogue tile) |

## Missing features (doc "New Features to Build" + "Full API Surface Reference")

| Feature | Doc section | New routes | Notes |
|---|---|---|---|
| Register / verify / reset password | "Auth — New Routes", "Register Page" | `POST /auth/register`, `GET /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`, dev `GET /auth/dev/force-verify` | `app/login/page.js` needs a "Register" link; `app/actions.js` gets the new auth actions alongside existing `loginAction`/`logoutAction`. |
| Event Requests (user) | "Event Requests — User App" | `GET/POST /user/event-requests*` | Net-new nav entry + pages under `app/(app)/`. |
| Event Requests (admin) | "Event Requests — Admin App" | `GET/POST /admin/event-requests*` | Needs `eligibility` panel rendering (health score, organizer_restricted, counts) — same shape family as `requester_snapshot` in Phase 5, reuse a shared presentational component if practical. |
| Contributors | "Contributors — Organizer App" | `/organizer/events/:id/contributors*` | Extends the organizer event detail page alongside `TeamManager` — likely a sibling `ContributorsManager.jsx` following the exact `TeamManager.jsx` pattern (search/add/remove), minus the role select (free-text `position_title` instead). |
| Staff Calls | "Staff Calls — Both Apps" | `/organizer/events/:id/staff-calls*`, `/organizer/staff-calls/:callId/*`, `/user/staff-calls*` | Largest net-new surface — organizer-side post/close/review, user-side browse/claim/apply. Two nav entries (organizer + user). |
| Self check-in | "Self Check-In — User App" | `POST /user/checkin/self-scan` | Conditional UI inside the existing booking detail view (`app/(app)/bookings/page.js` or its detail component), gated on `event.checkin_mode === 'self_scan'`. |
| Recognition | "Recognition — User App" | `GET /user/me/recognition` | Small read-only page/section, likely folded into `app/(app)/profile/page.js` or its own `/recognition` route + nav entry. |
| Points ledger | "Points — User App" | `GET /user/me/points` | **Already exists** — `app/(app)/points/page.js` per commit b32596d; verify it matches `{ balance, history }` shape and the `approval_status` filtering rule during Phase B triage, but this is NOT a gap per the task's "ALREADY ALIGNED" note for the admin side. Confirm user-side page independently — not explicitly marked aligned, only the admin points workflow was called out as aligned. |
| Review edit/delete | "Review Edit & Delete — User App" | `PATCH/DELETE /user/reviews/:id` | Extends `ReviewsSection.jsx` / `app/actions.js` with a `reviewEditWindowDays` check — needs `GET /admin/settings`-sourced value or a sane client-side default (doc says default 7 days) plumbed to the user side. |
| Platform Settings | "Platform Settings — Admin App" | `GET/PATCH /admin/settings` | Net-new admin page + nav entry. |

## Already aligned — do not re-plan

- Points approval workflow: `app/admin/points/page.js`, `app/admin/actions.js:331-352` (`resolvePointsAction`, `runPointsSyncAction`) already match the new `approve|adjust|reject` / `adjustedAmount` shape (built in commit b32596d). Confirmed by reading the file — no changes needed.

## Correction addendum (2026-10-08)

Two backend commits landed in `MFU-Events` **after** the research above was
written and partially reverse row #2's premise:

- `1411ddd` — `feat: restrict event requests and event creation to org
  members only`. `POST /api/organizer/events` and `POST
  /api/user/event-requests` both now **require** `org_id` in the body; the
  caller must be an active member of an active org, or the backend returns
  403. The faculty/staff solo `represented_as` path (row #2's framing) is
  fully removed.
- `2ff2609` — test fixup adding `org_id` to the organizer-event-creation
  test, confirming the above.

Row #2 above ("Event creation URL changed... new endpoint requires no
`orgId`") is **superseded**. The URL change is still correct
(`/api/organizer/organizers/:orgId/events` → `/api/organizer/events`), but
`org_id` is now mandatory in the body, not dropped. See the corrected
`phases/phase-2-event-creation-endpoint.md` and
`phases/phase-12-event-requests-user.md`, and `plan.md`'s "Doc inconsistency"
callout. The source-of-truth doc
(`/Users/panda/Desktop/MFU-Events/.docs/03-engineering/frontend-v18-migration.md`)
was updated by `1411ddd` in its breaking-change §2 and "Event Requests — User
App" section, but its top TL;DR line ("no club/department membership
required") was **not** updated and is now stale — do not trust that one
line; trust §2 and the Event Requests section instead.

## Addendum — post-Phase-19 backend work (2026-10-08, phases 20-23)

Four `MFU-Events` commits landed after all 19 original phases were marked
complete. All were read directly from source (`git show <sha>` and the
touched files in full) — not inferred from the doc — per this plan's house
rule. Summary, with the new phase each one unblocks:

### `029684f` — "fix: address three backend follow-ups from plan review"

Three independent fixes, confirmed against the diff itself:

1. `backend/routes/user.js:60-65` — new `GET /api/user/settings`, any
   signed-in user, returns `{ review_edit_window_days,
   checkin_window_grace_minutes }`. Unblocks the hardcoded
   `REVIEW_EDIT_WINDOW_DAYS = 7` in `components/events/ReviewsSection.jsx`
   that Phases 18 and 19 both flagged as backend-blocked. → **Phase 20**.
2. `backend/lib/services/venueService.js:109-123` — `venueService.schedule()`
   now embeds `org: {id,name}|null` and `main_organizer: {id,name}|null` on
   each event row. Unblocks the organizer chip Phase 6 removed from
   `app/admin/venues/schedule/page.js` for lack of this exact data. →
   **Phase 21**.
3. `backend/lib/services/eventRequestService.js:111-125` — `resubmitRequest`
   now calls the same `_checkOrgEligibility(userId, org_id)` guard
   `createRequest` already used, when `request.org_id` is set. This was
   Phase 12's flagged risk ("Resubmit + org_id") — confirmed **no frontend
   code change is required**: `resubmitEventRequestAction`
   (`app/actions.js:374-390`) already routes any `ApiError` through the
   existing `failure(error)` helper, which surfaces the backend's message
   verbatim (same 403 messages as `createRequest`: `"Organization not
   found or not active."` / `"You are not a member of this
   organization."`). The one thing that **is** now stale: the doc comment
   at `app/actions.js:370-372` ("the backend doesn't re-validate membership
   on resubmit") and the matching bullet in `plan.md`'s "Risks and
   unknowns" section. Both are comment/doc-only fixes — bundled into an
   append-only correction note on `phases/phase-12-event-requests-user.md`
   rather than given their own numbered phase (no behavior to build or
   verify beyond what already works). **No Phase 20-23 owns this** — see
   the correction note on Phase 12 instead, and `plan.md`'s updated
   follow-ups section.

### `1d4a639` — "feat(org): add self-serve join-request flow with manager approval queue"

Entirely new feature surface — `application_open` flag on organizations,
`orgApplications` collection, new `/api/user/organizations*` (user-side)
and `/api/org/*` (org_manager-side) routes. Full contract (status codes,
exact error messages, embed shapes) verified against
`backend/lib/services/orgApplicationService.js`,
`backend/lib/services/orgService.js` (the `create`/`update` signature
changes), `backend/lib/services/orgMembershipService.js` (`isOrgManager`
vs `isMember`), `backend/routes/org.js` and the relevant
`backend/routes/user.js` additions in full — not summarized secondhand.
Also cross-checked against `backend/test/org-application.test.js` (13
cases covering discovery, apply, duplicate/already-member/closed-org
rejections, manager queue view + 403 for non-managers, approve, reject
with feedback, double-resolve 409, and the `application_open` toggle
round-trip) — the test suite and the route source agree exactly, no drift
found. User-side: **Phase 22**. Org_manager-side: **Phase 23**.

### `48ffc32` — "docs: update frontend migration guide with org join-request routes"

Doc update covering the above. Spot-checked against source and found
**accurate** (unlike several earlier doc sections this plan had to correct)
— safe to cite as a secondary reference in Phases 22/23, but the phase
files themselves cite the backend source directly per house rule.

### `f0f7f40`, `fd9f343`, `16435a8` — new e2e/smoke suites + doc section

Skimmed for contract details not obvious from route code alone:

- `f0f7f40` (e2e suites) incidentally fixed two backend bugs found while
  writing the tests: `eventRequestService` now threads
  `registration_deadline` through `createRequest`/`approveRequest` (so an
  approved request's resulting event inherits the requester's requested
  deadline — relevant context if a future phase touches event-request
  approval, not applicable to phases 20-23), and
  `middleware/auth.js` now returns 403 for `SUSPENDED` users instead of
  silently allowing them through. Neither affects phases 20-23's contracts.
- `fd9f343` (smoke test) exercises `GET /api/user/settings` and the full
  org-join lifecycle end-to-end against a live server — confirms the
  contracts documented above are exercised, not just unit-tested in
  isolation.
- `16435a8` (doc smoke-test section) is documentation only, no contract
  content beyond what `fd9f343`'s own code already shows.

### Observation (not in scope for phases 20-23)

`backend/routes/admin.js:81-82` — `PATCH /api/admin/organizations/:id`
already delegates to the same `orgService.update(...)`, so
`application_open` is *also* toggleable by admins through the existing
admin organizer-detail page, if a PATCH form were added there. No such
form exists today (`components/admin/OrganizerMembers.jsx` only has the
activate/deactivate button, no generic field-edit form) and the task this
addendum was written for did not ask for an admin-side toggle — flagging
here only as a cheap future admin-side nicety, not a gap in phases 20-23.
