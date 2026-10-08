# Phase 10 — Review submission gated on event end time

**Breaking change:** #8.
**Depends on:** None.
**Risk:** Low.
**Independently shippable:** Yes.

## Steps

1. `components/events/ReviewsSection.jsx`:
   - Import `isPastEvent` from `../../lib/events`.
   - Line 58-59: compute `const canReview = attended && !alreadyReviewed && isPastEvent(event);`.
   - Line 93: branch on `canReview` instead of `attended && !alreadyReviewed`.
   - Add a distinct message for the "attended but event hasn't ended yet" case (e.g. multi-day event, checked in on day 1) — "You can review once the event ends." — so the user isn't left with the generic "Only students who attended can review this event" message, which would be misleading (they *did* attend).

## Files

- `components/events/ReviewsSection.jsx`

## Verification

- `npm run lint`
- `npm run build`
- Manual: find or create an event with `end_time` in the future and a test booking marked `attended` (or simulate by checking backend fixtures). Confirm the review form is hidden and the new "review once it ends" message shows instead of a form that would 400 on submit.
- Manual: confirm review submission still works normally for a genuinely completed event.

## Outcome

Implemented exactly as specified. `components/events/ReviewsSection.jsx`:
imported `isPastEvent` from `../../lib/events`; added
`const canReview = attended && !alreadyReviewed && isPastEvent(event);`;
changed the submit-form branch to key off `canReview`; added a new
`attended` (but not yet past) branch rendering "You can review once the
event ends." between the "already reviewed" and generic "only attendees"
messages, so the three states (not attended / attended-not-ended /
already-reviewed) each get a distinct, accurate message. Also tightened the
file-header doc comment to name all three gates (ended, attended, one review
per user) instead of just two.

**Backend verification (read directly from source, not just the doc):**
`backend/lib/services/reviewService.js:22-30` — `submitReview()`'s actual
400 condition is `!event.end_time || new Date(event.end_time) > new
Date()`, i.e. "no `end_time`, or `end_time` in the future." This is
*stricter* than `lib/events.js`'s `isPastEvent()` /
`backend/lib/services/eventService.js`'s `isPast()`, both of which are
`new Date(event.end_time || event.start_time) < now` — they fall back to
`start_time` when `end_time` is missing, so they'd report "past" for an
event with no `end_time` but a past `start_time`, while `submitReview`
would still 400 it. Used `isPastEvent()` anyway (matching the phase file's
instruction) because: (1) it's the same function the page already trusts
for the API's own `isPast`/`reviews: []` gating
(`backend/routes/user.js:71,73` use the identical `eventService.isPast`),
so the submit-button visibility stays consistent with whether reviews are
even visible at all; and (2) `end_time` is a `required` field in this
frontend's only event-creation path (`components/organizer/EventForm.jsx`
line ~123), so the "missing `end_time`" edge case `submitReview` guards
against cannot occur for events created through this UI — only
directly-seeded/API-created data could hit it, which is out of scope here.
Flagging this as a residual, low-probability drift rather than fixing it,
since fixing it would mean diverging `isPastEvent()`'s submit-eligibility
use from its visibility-gating use, which the phase file didn't ask for and
would need its own decision (e.g. a second, stricter
`canSubmitReview(event)` helper) if ever prioritized.

- `npm run lint` — clean, no errors/warnings.
- `npm run build` — compiled successfully; `/events/[id]` still listed as a
  dynamic (`ƒ`) route.
