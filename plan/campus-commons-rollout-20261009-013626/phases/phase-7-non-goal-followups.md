# Phase 7 — Non-goal follow-ups (write-up only, no implementation)

Status: not started

## Purpose

Earlier discarded mockups showed category-color pills and "N people going"
social proof on event cards. Confirmed in research (`research/existing-code.md`
§6) that neither field exists on the live `Event` model (`lib/events.js`,
backend `~/Desktop/MFU-Events/backend/lib/seed.js`). This phase is a written
note, not code:

1. Document the two gaps as backend feature requests:
   - `Event.category` (string or enum) if category-color pills are wanted —
     note this does NOT imply a third hue; category pills would still need to
     render within the two-blue system (e.g. varying opacity/weight of the
     same two blues, not a rainbow), per the hard color constraint.
   - An attendee/going count — either a materialized `Event.attendee_count`
     column or a derived count from `Booking` rows exposed by the API
     (`GET /api/.../events/:id` or the feed endpoint).
2. File these as follow-up items (e.g. a short note in this phase file or a
   ticket in whatever tracker the team uses) — do not block the rest of this
   plan on them, and do not fake the data client-side in the meantime.

## Verification

N/A — this phase produces a document, not code. "Done" means the follow-up is
written down somewhere durable (this file is sufficient) so it isn't
re-discovered and re-debated in a future redesign round.
