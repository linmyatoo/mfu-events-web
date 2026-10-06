# Phase 4 — scope decision: point-event creation + organizer-points approval (D4)

Status: **DONE (2026-10-06)** — user explicitly authorized backend changes for
this one gap ("Request backend changes" option below). Implemented and
verified end-to-end against a live backend. See "Implementation record"
at the bottom of this file for exact files/lines and verification evidence.

Original status (kept for history): decision needed from the user. Not
planned as an implementation phase under this task's constraints.

## What's missing

Two linked backend capabilities have no admin UI in the target at all:

1. **Creating a point event.** Only an `admin`-role actor may set
   `is_point_event`/`organizer_points_base` on event creation
   (`backend/lib/services/eventService.js:87-99`). Reference has
   `frontend/src/pages/admin/CreatePointEvent.jsx` for this. Target has no
   `app/admin/events/new` route at all — admins cannot create *any* event
   through the target UI today, point or otherwise.
2. **Approving/adjusting/rejecting proposed organizer points.**
   `pointsService.proposeOrganizerPoints`/`listPendingApprovals`/
   `resolveOrganizerPoints`/`syncStub` are fully implemented
   (`backend/lib/services/pointsService.js:36-110`), but **no route in
   `backend/routes/admin.js` exposes them** (confirmed by a full read of that
   file — 212 lines, no `points` path). Reference's
   `frontend/src/pages/admin/PointsPending.jsx` would therefore also be
   calling a route that doesn't exist on the current backend, same pattern
   as the two dead `/me/points` calls documented in
   `research/00-ground-truth-backend-contract.md`. **This needs direct
   confirmation** (grep `backend/routes/admin.js` again, and check
   `PointsPending.jsx`'s exact call) before assuming it's purely a frontend
   gap.

## Why this isn't just folded into Phase 1/2

Both halves require **new pages** (`app/admin/events/new`, something like
`app/admin/points`), which is unambiguously new UI, not "logic under
existing markup." The approval half may also require a **new backend route**
— and the task states the backend is shared/unmodified, which this plan
takes to mean no backend changes are in scope unless the user explicitly
says otherwise for this one gap.

## Options for the user

- **Skip entirely** — document as a known, deliberate gap (point events and
  organizer-points payouts are simply not administrable through this web
  app yet).
- **Build the UI only**, assuming a future backend route for approvals (i.e.
  build create-point-event now since its backend support is real; stub or
  omit the approval screen until a backend route exists).
- **Request backend changes** as a separate, explicitly-scoped follow-up
  plan (would need its own planning pass — different risk profile, touches
  a "shared and unmodified" system).

No implementation should start on this phase until one of the above is
chosen explicitly.

## Implementation record (2026-10-06)

Chose "Request backend changes" — backend edits were kept minimal and
additive, reusing `pointsService.js` as-is (no changes to that file).
Reference's `CreatePointEvent.jsx`/`PointsPending.jsx` were used for shape
only, not copied: both call routes that don't exist on this backend
(`POST /admin/events`, `/points/pending`, `/points/:id/resolve`,
`/points/sync` were all missing before this change) and
`CreatePointEvent.jsx`'s payload never actually sets `is_point_event` and
uses `userId` where the backend's `eventService.createEvent` expects
`user_id` — both are reference bugs, not ported.

### Backend — `MFU-Events/backend/routes/admin.js`

- Added `const pointsService = require('../lib/services/pointsService');`.
- Added `POST /events` (admin-direct event creation via
  `eventService.createEvent` — the only path that can set
  `is_point_event`/`organizer_points_base`, already enforced inside that
  service function; this route previously didn't exist on `admin.js` at
  all, so admins could not create *any* event through this backend's admin
  surface before this change, point or otherwise).
- Changed `POST /events/:id/complete` to also call
  `pointsService.proposeOrganizerPoints(updated)` when `updated.is_point_event`
  is true. This is the trigger point decided on instead of a new standalone
  "propose" route — it matches the comment already in `pointsService.js:34`
  ("Called once a point event has concluded... or directly after the last
  check-in", i.e. tied to an existing admin-owned lifecycle transition, not a
  new action) and needs no sweep job.
- Added a new `--- Points ---` route group: `GET /points/pending`
  (`listPendingApprovals`), `POST /points/:id/resolve`
  (`resolveOrganizerPoints`, body `{ action, adjustedAmount }`), `POST
  /points/sync` (`syncStub`). All three gated by
  `requirePermission('events')` — there is no distinct `points` permission
  category in `admin_permissions` (seed only defines `events`, `venues`,
  `users`, `items`, `flags`, `organizers`), and adding one was judged
  out-of-proportion for this gap; `events` was chosen because the proposal
  trigger (`/events/:id/complete`) already lives behind it.

### Frontend — `mfu-events-web`

- `lib/events.js`: added `APPROVAL_STATUS` and `pointsApprovalStatusMeta()`,
  mirroring the existing `*_META` helper pattern (not currently consumed by
  a component — the pending-queue page shows raw `pending`/`points` instead
  of needing a status badge since every row it lists is `pending` by
  definition; kept for when `historyFor`-style views are added later).
- `app/admin/actions.js`: added `createPointEventAction` (POST
  `/api/admin/events`, builds `{ organizers: [{ user_id, role }] }` —
  deliberately not reference's `userId` key), `resolvePointsAction` (POST
  `/api/admin/points/:id/resolve`), `runPointsSyncAction` (POST
  `/api/admin/points/sync`). Added `import { fromLocalInput } from
  '../../lib/events'`.
- `components/admin/PointEventForm.jsx` (new): create-only form — title,
  description, start/end time, capacity, organizer points base, and a
  repeatable organizer-team row (`<select>` of real users fetched
  server-side + role `<select>`), posting `organizer_user_id`/
  `organizer_role` multi-value fields that the action zips into
  `organizers`.
- `components/admin/PointsResolver.jsx` (new): per-proposal
  approve/adjust/reject buttons, modeled directly on
  `components/admin/FlagResolver.jsx`'s `useTransition` pattern.
- `components/admin/PointsSyncButton.jsx` (new): the "Run points sync"
  action, separated from `PointsResolver` since it's page-level, not
  per-row.
- `app/admin/events/new/page.js` (new): fetches `/api/admin/users` (via
  `apiGetAllowed`, `PermissionNotice` on 403) and renders
  `PointEventForm`.
- `app/admin/points/page.js` (new): fetches `/api/admin/points/pending` (via
  `apiGetAllowed`), renders `PointsSyncButton` + one card per pending
  proposal with `PointsResolver`. No extra enrichment call needed — `reason`
  already embeds the event title (set in `proposeOrganizerPoints`), and
  `subject_id` links straight to `/admin/users/:id` the same way
  `app/admin/flags/page.js` links flagged users.
- `components/navigation/navItems.js`: added `{ href: '/admin/points',
  label: 'Points', icon: 'star' }` to `adminNavItems`.
- `app/admin/page.js`: added a `+ New point event` button
  (`href="/admin/events/new"`) to the page header actions.

### Verification

- `npm run lint` — clean.
- `npm run build` — succeeds; `/admin/events/new` and `/admin/points` both
  appear in the route table.
- Live backend (`cd MFU-Events/backend && npm start`) + live frontend
  (`npm run dev`), exercised by curling the real routes directly
  (`POST /api/admin/events` → submit → start-review → approve →
  assign-venue → publish → close-registration → `POST
  .../complete`) as both the demo admin (`u1`) and the demo organizer
  (`u3`, added to the point event's team):
  - Completing a point event with one `main_organizer` (weight 1.0,
    base 100) produced exactly one `pending` proposal for 100 points, with
    `reason` = `"<title> — main organizer"`.
  - A second event with `main_organizer` + `co_organizer` (weight 0.5)
    produced proposals of 100 and 50 points respectively — confirms
    `ORGANIZER_ROLE_WEIGHTS` math end-to-end.
  - `GET /api/admin/points/pending` showed both proposals before
    resolution.
  - `POST /api/admin/points/:id/resolve` exercised all three actions:
    `approve` (100 pts), `adjust` (→75 pts), `reject` (50 pts → excluded).
  - Confirmed via a direct `pointsService.balanceFor('creator', 'u3')` /
    `historyFor` call (no route exposes balance directly — matches the
    plan's verified non-issue #1) that the organizer's balance updated to
    `175` (100 approved + 75 adjusted), and the rejected row contributed
    `0`.
  - `POST /api/admin/points/sync` returned `{ synced_count: 1 }` for the
    one unsynced `approved`/`adjusted`-eligible row at that point.
  - Confirmed `403` for a non-admin (organizer) hitting
    `/api/admin/points/pending`, `401` unauthenticated.
  - Rendered `/admin/points`, `/admin/events/new`, and `/admin` (new "+ New
    point event" link) through the real Next dev server with a forwarded
    `mfu_token` cookie — all `200`, correct content (empty-state message,
    nav active state on "Points", organizer-team fieldset present).
  - Both dev servers (`next dev` on :3000, backend on :4000) were stopped
    after verification.
