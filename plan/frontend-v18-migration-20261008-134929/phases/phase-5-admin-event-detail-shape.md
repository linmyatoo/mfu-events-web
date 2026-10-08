# Phase 5 — Admin event detail response shape

**Status: Complete (2026-10-08).** Verified directly against
`backend/routes/admin.js:167-193` (not the doc) before implementing.
Confirmed findings, some of which correct this phase file's assumptions:

- `requester_snapshot` is **not** keyed off `source_request_id` — it's
  computed from `event.created_by` unconditionally (`createdBy ? {...} :
  null`), so it's present for directly-created events too, not only events
  originating from an approved Event Request. It's only `null` if
  `created_by` fails to resolve to an existing user (orphaned record) — a
  defensive-null case worth keeping the guard for, but it won't trigger in
  normal operation. Implemented the header meta line and the health panel
  both guarded on `event.requester_snapshot` truthiness per the phase
  file's instruction anyway, since the null case is still reachable in
  principle.
- `event.contributors` on this admin endpoint is shaped as
  `{...eventContributor, user: {...userObject}}` (full nested user object,
  same as `team`) — **not** the flat `{...eventContributor, name}` shape
  that `GET /api/organizer/events/:id` (Phase 4) uses. The two endpoints
  diverge here; `app/organizer/events/[id]/page.js` reads
  `contributor.name`/`contributor.position_title` directly, but this admin
  page reads `contributor.user?.name`/`contributor.position_title`. Do not
  copy Phase 4's contributor-rendering code verbatim — confirmed via
  `backend/routes/admin.js:188-190` vs `backend/routes/organizer.js:120-122`.
- `event.organizer` (org entity) was already absent from this endpoint
  before this migration — `GET /api/admin/events/:id` never embedded it.
  The old `event.organizer?.name ?? 'No organizer entity'` read was already
  dead/always-falling-back code; replaced with `requester_snapshot.name`.
- `event.requested_venue` was likewise never present on this endpoint
  (confirmed — admin.js only ever returns `venue` and the event's own
  `venue_preference`); the read in `VenueAssigner.jsx:38` was dead code,
  removed.
- **Scope note (not fixed in this phase):** `app/admin/page.js:79` and
  `app/admin/venues/schedule/page.js:62` also read `event.organizer?.name`,
  against `GET /api/admin/events` (list) and `GET /api/admin/venues/schedule`
  respectively — both endpoints never return an `organizer` field either
  (confirmed: `backend/routes/admin.js:154-165`'s list mapper has no
  `organizer` key). These reads are dead code producing "No organizer"
  always, same pre-existing bug pattern as this phase's `[id]` page had, but
  neither file nor endpoint is in this phase's file list or any other phase
  file in this plan — flagging as an uncovered gap for a future phase or a
  follow-up ticket, not fixing here to keep this phase's diff scoped to its
  stated file list.
- Added a `Row` helper and inline "Requester health" panel directly in
  `app/admin/events/[id]/page.js` (not a new shared
  `components/admin/RequesterHealthPanel.jsx`) since Phase 5's file list
  doesn't include creating that component — Phase 13's plan note says it
  will add `RequesterHealthPanel.jsx` "shared with Phase 5"; when Phase 13
  lands, consider extracting this phase's inline panel markup into that
  shared component rather than duplicating it.

`npm run lint` and `npm run build` both pass.

**Breaking change:** #4 (admin side), #3 (`organizer_id` removal context).
**Depends on:** None strictly, but logically pairs with Phase 4.
**Risk:** Medium — `event.organizer?.name` and `event.requested_venue` reads need replacing with `requester_snapshot` and the team/contributors arrays.
**Independently shippable:** Yes.

## Steps

1. `app/admin/events/[id]/page.js`:
   - Line 90-92: `event.organizer?.name ?? 'No organizer entity'` reads the old org-entity field in the header meta row — replace with a `requester_snapshot.name` based line (e.g. "Requested by {requester_snapshot.name}"), falling back gracefully when `source_request_id` is null (events created directly by an organizer, not via an Event Request, may have no `requester_snapshot` — confirm against backend behavior during implementation; render nothing or "Created directly by the organizing team" in that case).
   - Line 105-128 ("Event team" section): already reads `event.team` with `member.user?.name` / `member.user?.role` — this already matches the new shape (`{...eventOrganizer, user: {...userObject}}`) exactly. No change needed structurally; just add a sibling "Contributors" section reading `event.contributors` (same read-only treatment as Phase 4, full management is Part B).
   - Add a requester health panel using `requester_snapshot` fields (`health_score`, `organizer_restricted`, `organizer_events_count`, `open_health_flags`, `open_organizer_flags`) — reuse `healthBand()` from `lib/events.js` for the score badge, matching the pattern already used in `app/(app)/profile/page.js:41,66-75`.
   - `requested_venue` is gone from the new shape entirely (doc §4 before/after) — grep this file and `VenueAssigner.jsx` for any `requested_venue` read and remove it; venue preference is already carried on the event itself as `venue_preference` (confirm no dead read remains).
2. No change expected to `is_point_event`/`organizer_points_base` reads (line 64-68) — already correct.

## Files

- `app/admin/events/[id]/page.js`
- `components/admin/EventReview.jsx` (verify only — no expected diff, it only reads `event.status`/`event.admin_feedback`)
- `components/admin/VenueAssigner.jsx` (verify for `requested_venue` reads)

## Verification

- `npm run lint`
- `npm run build`
- Manual: open an admin event detail page for an event that came from an approved Event Request. Confirm the requester health panel renders with real values, not `undefined`.
- Manual: open an admin event detail page for an event created directly (no `source_request_id`). Confirm the page doesn't crash when `requester_snapshot` is absent.
