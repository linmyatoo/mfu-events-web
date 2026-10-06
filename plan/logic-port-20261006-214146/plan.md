# Plan: port MFU-Events/frontend business logic into mfu-events-web (logic only, no UI changes)

## Goal

Bring `mfu-events-web`'s underlying logic (API calls, payload shaping, state
transitions/status gating, validation, derived values, refresh behavior,
error handling, permission checks) in line with `MFU-Events/frontend`'s
behavior and the real `MFU-Events/backend` contract, page by page, **without
any new markup, component restructuring, or visual changes** — except where
explicitly called out below as needing the user's sign-off to add minimal
markup, because the underlying feature has no existing UI surface at all.

## Acceptance criteria

- Every confirmed divergence below is either fixed (logic-only, reusing
  existing components/markup) or explicitly deferred with the user's
  decision recorded.
- No existing component's rendered structure, class names, or visual layout
  changes for divergences fixed under this plan.
- No reference-side bug or dead-code pattern is "fixed into" the target
  (see the verified non-issues list — these must stay as they are).
- `npm run build` / `npm run lint` (whichever this repo defines) pass after
  each phase.
- Each phase is manually verifiable against a running backend
  (`cd MFU-Events/backend && npm start`) using the demo accounts.

## Existing patterns to follow

- Server Actions in `app/*/actions.js` already follow a consistent shape:
  `'use server'`, a `failure(error)` helper that turns `ApiError` into
  `{ error, details }`, `revalidatePath` after mutations, and inline
  comments citing the exact backend route/service function. New actions
  should follow this shape exactly (see `app/organizer/actions.js` for the
  canonical example).
- Pages are React Server Components that call `apiGet`/`apiGetAllowed`
  directly and pass plain data down to presentational/interactive client
  components (see `app/organizer/events/[id]/page.js`). Client components
  (`'use client'`) own their own `useTransition`/`useActionState` busy-state
  and call the Server Actions — see `components/organizer/EventLifecycle.jsx`.
- Derived/display logic belongs in `lib/events.js` (status/venue/audience
  labels, transition table, date formatting) and `lib/points.js` (points
  derivation) — not duplicated inline in components. Any new derived value
  should go there, mirroring the existing JSDoc-style comments that cite the
  backend file/line it mirrors.

## Confirmed divergences (ordered by risk/dependency)

### D1 — Organizer cannot set a structured venue request (`requested_venue_id`)

- Reference: `frontend/src/pages/creator/EventDetail.jsx:45-50,97,174-185,381-418`
- Backend: `backend/lib/services/eventService.js:105-106`,
  `backend/lib/services/venueService.js:119-145`,
  `backend/routes/organizer.js:194-197`, `backend/routes/admin.js:125,136`
- Target gap: `mfu-events-web/app/organizer/actions.js:35-59`
  (`eventFieldsFrom` never includes `requested_venue_id`); no venue-picker
  component anywhere under `app/organizer/**`.
- Downstream effect: `mfu-events-web/components/admin/VenueAssigner.jsx:38,90-92`
  already has code for `event.requested_venue` / `venue.isRequested` that can
  never activate.
- **Needs a scope decision**: fixing this fully requires a new venue-picker
  UI element on the organizer event page (new markup). A partial, logic-only
  fix is possible (accept `requested_venue_id` in `eventFieldsFrom` so a
  future/hidden UI can use it) but delivers no visible behavior change on its
  own. See `phases/phase-1-organizer-venue-request.md`.
  **DONE (2026-10-06)** — user approved option (a); implemented and verified
  end-to-end. See the phase file for exact files/lines and verification
  evidence.

### D2 — Reviews missing on organizer event detail page

- Reference: `frontend/src/pages/creator/EventDetail.jsx:258-277`
- Backend: `backend/routes/organizer.js:106-114` (already returns
  `event.reviews` when `canSeeContent && isPast`)
- Target gap: `mfu-events-web/app/organizer/events/[id]/page.js` never
  renders `event.reviews`, despite already fetching them.
- Fix: reuse the existing `mfu-events-web/components/events/ReviewsSection.jsx`
  (already used at `app/(app)/events/[id]/page.js:133`) in a read-only mode
  on the organizer page. This is a new *usage site* of an existing
  component, not new markup/component design — lowest-risk phase, do first.
  See `phases/phase-2-organizer-reviews-section.md`.

### D3 — `requested_venue_name` dead field reference (cosmetic)

- `mfu-events-web/lib/events.js:126`
- Optional cleanup only; zero behavior change either way. See
  `phases/phase-3-optional-cleanup.md`.

### D4 — Missing admin point-event / organizer-points-approval workflow

- Reference: `frontend/src/pages/admin/{CreatePointEvent,PointsPending}.jsx`
- Backend: `backend/lib/services/pointsService.js:36-110` (service layer
  exists; **no route in `backend/routes/admin.js` calls it** — this is a gap
  in the backend too, not just the frontend)
- Target: no route at all under `app/admin/**` for either half.
- **This is a feature-gap/scope question, not a "fix logic under existing
  markup" task** — out of this plan's default scope. See
  `phases/phase-4-scope-decision-point-events.md` for what would be required
  if the user wants it built anyway (including a likely backend change,
  which is outside "backend is shared and unmodified").

## Verified non-issues — do not change these

1. Reference's user-facing (`src/pages/user/Points.jsx`) and organizer-facing
   (`src/pages/creator/Points.jsx`) points pages call endpoints that do not
   exist on the current backend (`GET /api/user/me/points`,
   `GET /api/organizer/me/points` — only `backend/routes/creator.js`, which
   is never mounted, defines `/me/points`). Target's `lib/points.js`
   (derive from bookings) is the correct behavior. Do not add a
   user/organizer "points" API call matching reference.
2. `backend/routes/creator.js` is dead code (server.js mounts `/api/creator`
   to `organizerRoutes`, not to this file). Never use it as a source of truth.
3. Resubmit note (`{ note }` body on `/events/:id/resubmit`) — reference
   sends it, backend silently no-ops on it (not a real `Event` column).
   Target's bodyless resubmit call is equivalent; no change.
4. Admin venue re-assignment while `status === 'venue_assigned'` — target
   already supports this (matches backend), reference's admin UI doesn't
   offer it at all. Do not regress target to match reference's narrower
   `ADMIN_ACTIONS` tables.
5. `AdminUsers.jsx`'s `'inactive'` filter option (reference) is a dead
   option — the real enum value is `deactivated`. Target already uses the
   correct value. Do not port the typo.

## Phase plan

1. **Phase 0 — verification pass** (no code changes): confirm the handful of
   admin components not read byte-for-byte in this pass
   (`OrganizerMembers.jsx`, `NewOrganizerForm.jsx`, `ItemRequestReview.jsx`,
   `UserActions.jsx`, `LoginForm.jsx`) against their reference counterparts
   before starting D1/D2, since they're cheap to check and this plan did not
   exhaustively diff them line-for-line.
2. **Phase 1 — organizer structured venue request (D1)**. Needs an explicit
   user decision first: (a) add a minimal venue-picker UI element (new
   markup, requires lifting the "no new markup" constraint for this one
   case), or (b) logic-only groundwork (accept the field server-side) with
   no visible change, or (c) defer entirely. Do not start implementation
   until the user picks one.
3. **Phase 2 — reviews on organizer event page (D2)**. Lowest risk, reuses
   an existing component, closes a real gap, no constraint conflict. Good
   candidate for first actual code change.
4. **Phase 3 — optional cleanup (D3)**. Trivial, bundle with Phase 2 or skip.
5. **Phase 4 — scope decision on point events (D4)**. Documentation/decision
   only under this plan; implementation (if approved) would need its own
   follow-up plan since it likely touches the backend.

## Risks and unknowns

- **Phase 1's scope conflict is the main risk**: the task's "UI must not
  change" constraint and "fix the real gap" goal are in tension for D1 and
  D4. This plan deliberately stops at the decision point for both rather
  than guessing.
- **Backend is described as shared/unmodified**, but D4's approval half has
  no backend route at all — closing it fully is not achievable as a
  frontend-only change. Flagged, not assumed.
- **Admin components not exhaustively diffed** (see Phase 0) could contain
  smaller divergences this pass didn't surface; low risk given how closely
  everything else matched, but should be checked before declaring this port
  complete.
- **Runtime verification requires a running backend** with seeded demo data
  (`MFU-Events/backend`) — this plan's findings are from static reading only;
  no endpoint was actually exercised. Treat phase verification steps as
  mandatory before considering any phase done.

## Verification

For any phase that changes code:
1. `cd /Users/panda/Desktop/MFU-Events/backend && npm start` (or the
   repo's documented start command) to get a live backend with seeded data.
2. `npm run dev` (or `npm run build && npm start`
   for a closer-to-prod check).
3. Run the repo's lint/build commands — inspect `package.json` for the exact
   scripts (not yet confirmed in this pass); typically `npm run lint` and
   `npm run build`.
4. Manually walk the affected page as the relevant demo account (see
   `frontend/src/pages/Login.jsx:6-11` for demo emails /
   `demo1234` — same backend, same seed data) and confirm:
   - Phase 2: organizer event detail page shows a Reviews section for a past
     event with existing reviews, read-only, no booking/submit form.
   - Phase 1 (once scoped): organizer can express a venue request that shows
     up as `event.requested_venue` in the admin event page's `VenueAssigner`
     ("Requested by organizer" badge actually appears for a real event).
5. Re-run the specific backend test files relevant to the touched area if
   convenient (e.g. `backend/test/organizer-permissions.test.js`,
   `backend/test/booking.test.js`) to make sure no payload-shape change
   broke a contract the backend enforces.

## Recommended first implementation step

Start with **Phase 2** (`phases/phase-2-organizer-reviews-section.md`): it
closes a real, well-evidenced gap, requires no new markup (reuses
`ReviewsSection.jsx`), has no scope-conflict with the "no UI change"
constraint, and is independently verifiable. Phase 1 and Phase 4 both need a
user decision before any code is written.

## Plan folder

`/Users/panda/Desktop/mfu-events-web/plan/logic-port-20261006-214146/`
