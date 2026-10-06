# Organizer portal diff notes

File pairs read in full:
- `frontend/src/pages/creator/EventDetail.jsx` vs `mfu-events-web/app/organizer/events/[id]/page.js`
  + `mfu-events-web/components/organizer/{EventLifecycle,TeamManager,ItemRequestForm,AttendeeList}.jsx`
- `frontend/src/pages/creator/CreateEvent.jsx` vs `mfu-events-web/app/organizer/events/new/page.js`
  + `mfu-events-web/components/organizer/EventForm.jsx`
- `frontend/src/pages/creator/CheckIn.jsx` vs `mfu-events-web/app/organizer/check-in/page.js`
  + `mfu-events-web/components/organizer/CheckInScanner.jsx`
- Backend ground truth: `backend/routes/organizer.js`, `backend/lib/services/{eventService,organizerService,venueService,itemService,checkinService,qaService}.js`

## CONFIRMED DIVERGENCE 1 — structured venue request dropped (organizer can't set `requested_venue_id`)

Reference lets a Main/Co-Organizer, while the event is still `draft`, fetch
available venues for the event's time window and PATCH a specific
`requested_venue_id`:

- `frontend/src/pages/creator/EventDetail.jsx:45-50` — fetches
  `GET /events/:id/venues?start_time=&end_time=&event_id=` (→
  `GET /api/organizer/venues?...`, see `backend/routes/organizer.js:194-197`
  → `venueService.listWithAvailability`, `backend/lib/services/venueService.js:119-130`,
  which annotates each venue with `available`/`conflicts`).
- `frontend/src/pages/creator/EventDetail.jsx:174-185` (`VenueRequestPicker`)
  renders that list as a `<select>`, disabling unavailable venues.
- `frontend/src/pages/creator/EventDetail.jsx:381-418` — `save()` calls
  `api.patch('/events/:id', { requested_venue_id: venueId || null })`.

Backend support for this is real and still present:
- `backend/lib/services/eventService.js:105-106` — `createEvent` accepts
  `requested_venue_id` and `venue_preference` as two independent fields.
- `backend/lib/services/venueService.js:134-145` (`listMatchingForEvent`) —
  computes `isRequested` from `event.requested_venue_id === v.id` and
  `matchesPreference` from `event.venue_preference` substring match — two
  genuinely different signals.
- `backend/routes/admin.js:125,136` — admin's event list/detail embed a
  `requested_venue` object resolved from `requested_venue_id`.

Target has no equivalent:
- `mfu-events-web/app/organizer/actions.js:35-59` (`eventFieldsFrom`, used by
  both `createEventAction` and `updateEventAction`) only ever sends
  `venue_preference` (free text). `requested_venue_id` is never read from a
  form or sent in any PATCH/POST body anywhere in `app/organizer/**`.
- `mfu-events-web/components/organizer/EventLifecycle.jsx` has no venue
  picker UI at all (confirmed by full read — only submit/resubmit/open/close/
  clone/cancel buttons).
- `mfu-events-web/components/admin/VenueAssigner.jsx:38,90-92` already
  renders `event.requested_venue` and a `venue.isRequested` "Requested by
  organizer" badge — this code path can never activate today, because
  nothing in the organizer portal ever sets `requested_venue_id`. This is the
  concrete, user-visible symptom: an admin feature that's built but can never
  show real data.
- `mfu-events-web/app/organizer/venues/page.js` is a *view-only* standalone
  venue browser (not present in reference) — it has no relationship to a
  specific event and does not write `requested_venue_id` either; it's a
  separate, additive feature, not a substitute for the missing picker.

Fix shape (logic only, existing markup): either (a) reuse the already-built
`EventLifecycle`/event-detail markup to add a `requested_venue_id` select —
this *is* new markup, flag with user first — or (b) at minimum, wire
`eventFieldsFrom`/the edit form's existing `venue_preference` text field path
to also resolve/send `requested_venue_id` if the organizer's venues browse
page (`/organizer/venues`) is extended to deep-link "request this venue for
event X" back into the edit action. Recommend raising this with the user
before deciding between "add a minimal picker" vs "leave as a documented
gap" given the no-new-markup constraint.

## CONFIRMED DIVERGENCE 2 — Reviews section missing on organizer event detail page

- `backend/routes/organizer.js:106-114` (`GET /api/organizer/events/:id`)
  already returns `reviews: canSeeContent && isPast ? reviewService.reviewsForEvent(event.id) : []`.
- Reference renders them: `frontend/src/pages/creator/EventDetail.jsx:258-277`
  (`Reviews` card, gated on `canSeeContent && event.reviews?.length > 0`,
  with the "reviewer identity is hidden" callout and sentiment badges).
- Target: `mfu-events-web/app/organizer/events/[id]/page.js` fetches `event`
  (which includes `event.reviews` per the backend route above) but never
  renders a reviews section — confirmed by full read of the page plus every
  component it imports (`AnswerForm`, `AttendeeList`, `EventLifecycle`,
  `ItemRequestForm`, `TeamManager`). None render reviews.
- `mfu-events-web/components/events/ReviewsSection.jsx` already exists,
  already renders sentiment badges and the "posted anonymously" line
  correctly, and is already used on the user-facing event page
  (`app/(app)/events/[id]/page.js:133`). Reusing it on the organizer page is
  the lowest-risk fix — no new component, no new markup pattern, just a new
  usage site. (It currently takes `{ event, user }` and renders a submit
  form gated on `event.myBooking` — the organizer page has no booking, so the
  component would need a read-only variant or a `canSubmit={false}` style
  prop; this is a small, scoped change, not a rewrite.)

## Verified non-issues (do not change)

- **Resubmit note field.** Reference: `frontend/src/pages/creator/EventDetail.jsx:80`
  calls `api.post('/events/:id/resubmit', { note: resubmitNote })`. Backend's
  `resubmitEvent(eventId, patch, actingUser)` (`backend/lib/services/eventService.js:167-181`)
  treats `patch` as event-field updates (after stripping `status`, `venue_id`,
  `is_point_event`, `organizer_points_base`, `admin_feedback`) — `note` is not
  a real `Event` column, so this silently no-ops (writes a throwaway `note`
  property that nothing reads back). Target's `eventLifecycleAction` sends no
  body on resubmit (`mfu-events-web/app/organizer/actions.js:126-139`), which
  is behaviorally identical and arguably cleaner. **No action needed.**
- **Organizer "My points" page.** See `research/00-ground-truth-backend-contract.md`
  — reference's `creator/Points.jsx` calls a nonexistent route. Target
  correctly has no such page. Do not add one.
- **Team/role permission checks** (`main_organizer` manages team,
  `main_organizer`/`co_organizer` can edit, all three roles can check in) —
  target's `TeamManager.jsx`, `AttendeeList.jsx`, and
  `app/organizer/events/[id]/page.js:50-57` (`isMain`, `canEdit`) match
  `backend/lib/services/organizerService.js:18-36`
  (`isMainOrganizer`/`canEditEvent`/`canManageCheckin`/`canManageTeam`)
  exactly. No divergence found.
- **Item request flow** (organizer side) — `ItemRequestForm.jsx`'s "replace
  every pending row" PUT semantics match `itemService.setRequests`
  (`backend/lib/services/itemService.js:51-70`) exactly, including the
  "resolved rows are read-only" framing.
- **Check-in scanning** — `CheckInScanner.jsx` → `checkInByTokenAction` →
  `POST /api/organizer/checkin/scan { qrToken }` matches
  `checkinService.checkInByQr` (`backend/lib/services/checkinService.js:43-48`)
  exactly, including the permission check via `canManageCheckin`.
