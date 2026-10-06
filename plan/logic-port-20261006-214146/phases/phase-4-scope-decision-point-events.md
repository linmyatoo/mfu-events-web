# Phase 4 — scope decision: point-event creation + organizer-points approval (D4)

Status: decision needed from the user. Not planned as an implementation
phase under this task's constraints.

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
