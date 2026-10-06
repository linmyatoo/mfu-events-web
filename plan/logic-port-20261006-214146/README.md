# Logic port: align mfu-events-web business logic with MFU-Events/frontend + backend

Goal: make the TARGET app's (`mfu-events-web`) *logic* — API calls, payload
shaping, status gating, validation, derived values, error handling,
permission checks — match the REFERENCE app's behavior (`MFU-Events/frontend`)
and the real backend contract (`MFU-Events/backend`), without changing any UI
markup/structure.

This is a research/planning deliverable only. No implementation code was
written. See `plan.md` for the full findings and phase breakdown.

## TL;DR of what we found

The prior session's port (see `../three-portals-20260930-134940/`) is
**already unusually well aligned** with the backend — most of `lib/api.js`,
`app/*/actions.js`, and the admin/organizer/user pages read backend source
files directly and cite them in comments. The remaining gaps are narrow and
concrete, not systemic:

1. **Real bug (organizer venue request):** organizers in the target app can
   only set a free-text venue preference; the reference app's structured
   "pick an available venue, see conflicts" flow (`requested_venue_id`) was
   dropped. This also starves an already-built admin feature
   (`VenueAssigner`'s "Requested by organizer" badge) of data it expects.
2. **Real bug (missing Reviews on organizer event page):** the backend
   already returns `event.reviews` to the organizer-side event detail
   endpoint, and the target already has a working `ReviewsSection` component
   (used on the user side) — it's just never rendered on the organizer page.
3. **Scope decision needed (not a "logic" fix):** the backend's point-event /
   organizer-points-approval workflow (`is_point_event`, `pointsService`
   pending approvals) has **no admin UI at all** in the target. Building it
   means adding whole new pages, which conflicts with the "no new markup"
   constraint unless the user explicitly lifts it for this one gap.
4. **Important negative result — do not "fix" these:** the reference
   frontend itself calls two endpoints that do not exist on the current
   backend (`GET /api/user/me/points`, `GET /api/organizer/me/points`). The
   target's workaround (derive points from bookings data) is the *correct*
   behavior, not a divergence to revert. Also, `backend/routes/creator.js` is
   dead code (never mounted) — `backend/routes/organizer.js` is the real
   contract behind the reference's "creator" pages.

## Files

- `plan.md` — full plan: goal, acceptance criteria, confirmed divergences
  with file:line evidence, phases, risks, verification.
- `research/` — per-area diff notes (ground-truth backend contract, organizer
  portal, admin portal, user portal, dead-reference-code notes).
- `phases/` — one file per phase, execution-ready.
