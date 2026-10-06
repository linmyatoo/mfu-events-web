# Phase 4 — admin events

Status: **done**

`/admin` (filterable list) and `/admin/events/[id]`.

`EventReview` derives its buttons from `EVENT_TRANSITIONS`. Verified live:

| Event | Status | Lifecycle buttons offered |
| --- | --- | --- |
| e13 | submitted | Start review |
| e14 | under_review | Approve, Reject, Request changes |
| e15 | approved | Cancel event (+ the venue assigner) |
| e16 | venue_assigned | Publish, Cancel event |
| e2 | completed | none |

`reject` and `request-changes` collect the note the organizer reads; the
action refuses to send an empty one.

`VenueAssigner` uses `GET /venues/for-event/:eventId`, which annotates each
room with `isRequested`, `matchesPreference`, `capacityOk` and `hasConflict`.
Assigning v1 to e15 moved it approved → venue_assigned and the page
re-rendered with Publish offered.

**Not exercised:** the 409 `conflicts` path. `ApiError.details` carries the
array and `VenueAssigner` lists it, but no two seeded events share a venue and
an overlapping window, so nothing could trigger it without fabricating data.
