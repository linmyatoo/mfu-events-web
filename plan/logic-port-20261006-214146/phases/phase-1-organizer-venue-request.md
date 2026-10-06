# Phase 1 — organizer structured venue request (D1)

Status: DONE (2026-10-06). User explicitly approved option (a) — minimal
venue-picker `<select>` added to `EventForm.jsx`, bundled into the existing
`eventFieldsFrom`/`createEventAction`/`updateEventAction` path rather than a
separate dedicated action (deviates from the "mirror reference's dedicated
PATCH" suggestion below — this was an explicit instruction, recorded here as
a deviation, not a mistake).

## What was implemented

- `app/organizer/actions.js` — `eventFieldsFrom` now reads and forwards
  `requested_venue_id` (null when empty), alongside the existing fields.
- `components/organizer/EventForm.jsx` — new `venues` prop; renders a
  `<select name="requested_venue_id">` (reusing the existing `field`/`select`
  CSS classes) right after the `venue_preference` field. Options show
  name/capacity/location and disable (but still list) venues the backend
  flags as unavailable for the event's current time window.
- `app/organizer/events/new/page.js` — fetches `GET /api/organizer/venues`
  (no time window yet since the organizer hasn't picked dates) and passes it
  as `venues`.
- `app/organizer/events/[id]/edit/page.js` — fetches
  `GET /api/organizer/venues?start_time=&end_time=&event_id=` using the
  event's own window (matching reference's exclude-self behavior) and passes
  it as `venues`.

## Verification performed

- `npm run lint` — clean.
- `npm run build` — succeeds, all routes compile.
- Manual end-to-end with a live backend (seeded demo data):
  1. Logged in as organizer `su.myat.noe@mfu.ac.th` (main organizer on draft
     event `e7`, "Hackathon Kickoff").
  2. Loaded `/organizer/events/e7/edit`, confirmed the new "Requested venue"
     select rendered with all active venues as options.
  3. Submitted the edit form with `requested_venue_id=v7` ("Innovation Lab",
     which also matches the event's existing free-text `venue_preference`).
     Confirmed via `GET /api/organizer/events/e7` that
     `requested_venue_id: "v7"` persisted.
  4. Submitted the event (`POST /events/e7/submit`), then approved it as
     admin `kyaw.zin.latt@mfu.ac.th` (`start-review` then `approve`).
  5. Loaded `/admin/events/e7` as admin — confirmed `VenueAssigner` shows
     "organizer asked for Innovation Lab" in the summary line, and the
     Innovation Lab venue card carries the badge `Requested by organizer`.
  6. Stopped both dev servers afterward.
- `backend/` was only read, never edited; `backend/data/` (gitignored, seed
  output) was regenerated/mutated by running the seed script and exercising
  the API during verification — expected and harmless, not a tracked file.

---

Original phase notes (pre-implementation) kept below for context.

## What's broken

See `plan.md` D1 and `research/01-organizer-portal.md` for full evidence.
Summary: the organizer portal can only send a free-text `venue_preference`;
it can never set `requested_venue_id`, so the backend's
`isRequested`/`matchesPreference` venue-matching logic and the already-built
admin `VenueAssigner` "Requested by organizer" badge
(`components/admin/VenueAssigner.jsx:38,90-92`) can never activate for
organizer-created events.

## Decision needed before implementation

Closing this gap for real requires the organizer to be able to pick a
specific venue from an availability list — reference does this with a
`<select>` of venues annotated `available`/`conflicts`
(`frontend/src/pages/creator/EventDetail.jsx:381-418`). Three options:

- **(a) Add a minimal venue-picker control** to the existing organizer event
  detail page (reusing the existing `card`/`field`/`select` markup patterns
  already used elsewhere on that page, e.g. in `TeamManager.jsx`'s role
  `<select>`). This is new markup in the literal sense (a new `<select>` and
  its wrapping elements that don't exist today), even though it reuses
  existing CSS classes. **Requires explicit user sign-off** given the task's
  "no new markup" constraint.
- **(b) Logic-only groundwork**: extend `eventFieldsFrom`
  (`app/organizer/actions.js:35-59`) and `updateEventAction`/
  `createEventAction` to accept and forward `requested_venue_id` if present
  in `formData`, without adding any new form field. This changes nothing
  visible today (no form sends that key yet) and sets up a future UI change
  cheaply, but delivers zero user-facing fix on its own — arguably pointless
  without (a).
- **(c) Defer.** Document as a known gap, no code change.

## If the user picks (a)

1. Add a server-side data fetch on the organizer event page mirroring
   reference's `GET /api/organizer/venues?start_time=&end_time=&event_id=`
   (already proxied by `backend/routes/organizer.js:194-197` →
   `venueService.listWithAvailability`) — only when `event.status === 'draft'`
   and `canEdit` is true, matching reference's gating
   (`frontend/src/pages/creator/EventDetail.jsx:173-184`).
2. Add `requested_venue_id` to `eventFieldsFrom` (or a dedicated small action,
   mirroring reference's separate `PATCH { requested_venue_id }` call rather
   than bundling it into the full edit form) — reference uses a dedicated
   action distinct from the full edit form; prefer matching that shape
   (`updateVenuePreferenceAction` or similar) to avoid disturbing the
   existing `updateEventAction` validation path.
3. Render the picker only in the "no venue assigned yet" branch, mirroring
   reference's conditional (`event.venue` → show assigned venue;
   else if `canEdit && isDraft` → show picker; else if
   `requested_venue_id` set → show "requested, pending" text; else → "Admin
   will assign one").

## Verification (once implemented)

1. As an organizer (demo account with an `event_manager`+ membership),
   create a draft event, request a specific venue.
2. As admin, open that event's detail page once it reaches `approved` status
   — confirm `VenueAssigner` now shows "organizer asked for X" and the
   "Requested by organizer" badge on the matching venue card.
3. Confirm picking a different, conflicting venue still surfaces the 409
   `conflicts` array correctly (existing `VenueAssigner` error-rendering path,
   untouched).
