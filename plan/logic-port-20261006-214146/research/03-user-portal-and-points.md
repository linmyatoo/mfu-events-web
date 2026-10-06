# User portal diff notes

File pairs read in full:
- `frontend/src/pages/user/{EventsFeed,EventDetail,Bookings,Points,Health}.jsx`
- `mfu-events-web/app/(app)/{page,events/[id]/page,bookings/page,points/page,health/page,items/page,profile/page}.js`
- `mfu-events-web/components/events/{EventFeed,BookingPanel,QuestionsSection,ReviewsSection}.jsx`
- `mfu-events-web/lib/{events,points}.js`
- Backend: `backend/routes/user.js`, `backend/lib/services/{bookingService,healthService,reviewService}.js`

## No confirmed logic divergences found in this area

This is the most thoroughly aligned slice of the app:

- **Feed** — target's `feedForUser` equivalent matches exactly: audience
  matching (`matchesAudience`), title-only search, sort by `start_time`.
  `EventFeed.jsx:24-41` explicitly re-implements the same title-substring
  filter client-side for instant typing feedback, and the code comment
  correctly cites `eventService.feedForUser` as the source of truth it must
  not disagree with.
- **Booking** — `BookingPanel.jsx` recomputes
  `bookingBlockedReason()`/`isRegistrationClosed()`
  (`mfu-events-web/lib/events.js:240-261`) client-side purely to avoid a
  round trip for the common rejections; the comment correctly notes capacity
  is deliberately not pre-checked client-side because the feed doesn't
  return a live count — matches `bookingService.createBooking`'s actual
  check order (`backend/lib/services/bookingService.js:18-30`) field-for-field
  (status → deadline → booking_restricted → audience → duplicate → capacity).
- **Reviews** — `canReview` logic (`attended && !alreadyReviewed`) in
  `ReviewsSection.jsx:53-54` matches reference `EventDetail.jsx:38`
  (`event.isPast && myBooking?.status === 'attended' && !alreadyReviewed`)
  and matches `reviewService.submitReview`'s own gates
  (`backend/lib/services/reviewService.js:29-37`: must have an `attended`
  booking, one review per event).
- **Points** — see the ground-truth note: target's `lib/points.js` derives
  the balance from bookings instead of calling the reference's nonexistent
  `GET /api/user/me/points`. This is the correct fix, not a gap.
- **Health** — `app/(app)/health/page.js` and reference `Health.jsx` both
  surface `score`, `bookingRestricted`, `openFlag`, `history` identically
  from `GET /api/user/me/health` (`backend/routes/user.js:84-89`), including
  the "flag ≠ automatic restriction" distinction
  (`healthService.maybeRaiseFlag`, `backend/lib/services/healthService.js:40-57`).
- **Items catalogue** (`app/(app)/items/page.js`) — target adds a read-only
  equipment catalogue page the reference doesn't have as a standalone user
  route. This is purely additive (backend already exposes
  `GET /api/user/items`, `backend/routes/user.js:94-98`) and introduces no
  logic divergence — noted for completeness, no action needed.

## One cosmetic-only note (optional cleanup, not required)

`mfu-events-web/lib/events.js:126` (`venueName()`) checks
`event.requested_venue_name` before `event.venue_preference`. That field is
only ever written by the backend's clone endpoint
(`backend/routes/organizer.js:134`, `requested_venue_name: event.requested_venue_name || null`)
copying from a field that `eventService.createEvent`
(`backend/lib/services/eventService.js:94-120`) never sets in the first
place — so it is always `null` in practice on every real event, including
clones. The branch is dead but harmless (falls through correctly to
`venue_preference`). Not required for this port; listed as an optional,
near-zero-risk tidy-up only if the user wants it bundled in.
