# Phase 3 — Organizer "My Events" and check-in listing

**Status: Complete (2026-10-08).** Implemented exactly as scoped below.
`app/organizer/page.js`: replaced the `EVENT_MANAGING_ROLES`-filtered,
per-org `Promise.all` fetch against `/api/organizer/organizers/:orgId/events`
with a single `const events = await apiGet('/api/organizer/events')`; removed
the per-org `<section>` grouping (and the `managing`/`groups`/`canCreate`
locals) in favor of one flat `<ul>`, `event.myRole` continues to render
correctly per-event; dropped the "You are a member, not an event manager"
empty state and its gate — "New event" is now always shown in the page
actions since any authenticated user can create (subject to the Phase 2
org-membership check on the create form itself); `requireOrganizer()` is
still called for the portal guard but its `memberships` return value is no
longer needed here, so it's called without destructuring; dropped the
now-unused `EVENT_MANAGING_ROLES` and `MEMBER_ROLE_LABELS` imports.
`app/organizer/check-in/page.js`: same endpoint swap, replaced the per-org
`Promise.all`/`.flat()` with the flat `events` array feeding directly into
the existing `running` filter/sort; dropped the unused `EVENT_MANAGING_ROLES`
import. Verified: `npm run lint` (clean) and `npm run build` (succeeds, all
routes compile, including `/organizer` and `/organizer/check-in`). Manual
sign-in verification against a running backend (role-chip rendering for
`main_organizer`/`co_organizer`/`checkin_staff`, "No events yet" empty state
for a brand-new user) was not performed in this session — do that before
considering the cross-phase smoke test in `plan.md` fully satisfied.

**Breaking change:** #2 (same endpoint family), fallout from #6.
**Depends on:** Phase 1.
**Risk:** Low-medium — both pages share one broken pattern, fix is mechanical.
**Independently shippable:** Yes.

## Steps

1. `app/organizer/page.js`:
   - Replace the `EVENT_MANAGING_ROLES`-filtered, per-org `Promise.all` fetch (line 28-42) with a single `const events = await apiGet('/api/organizer/events')`.
   - Remove the per-org `<section>` grouping (line 72-135) — render one flat list instead. `event.myRole` is already read per-event (line 121-123) and stays correct.
   - Drop the "You are a member, not an event manager" empty state (line 59-70) and its `canCreate` gate (line 44) — any authenticated user can create, so "New event" is always available.
2. `app/organizer/check-in/page.js`:
   - Replace the per-org `Promise.all` fetch (line 26-34) with `const events = await apiGet('/api/organizer/events')`, then keep the existing `running` filter/sort (line 36-45) applied to the flat list.
3. Both files: drop the now-unused `EVENT_MANAGING_ROLES` import if nothing else in the file needs it.

## Files

- `app/organizer/page.js`
- `app/organizer/check-in/page.js`

## Verification

- `npm run lint`
- `npm run build`
- Manual: as a user who is `main_organizer`/`co_organizer`/`checkin_staff` on at least one event, confirm `/organizer` lists it with the correct role chip, and `/organizer/check-in` lists it if upcoming/published.
- Manual: as a brand-new user with no event-team membership at all, confirm `/organizer` shows the "No events yet" empty state (not a crash) and "New event" is clickable.
